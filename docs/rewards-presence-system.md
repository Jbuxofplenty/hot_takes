# Rewards & Presence System

This document explains how the rewards system and real-time presence tracking works using Firestore.

## Overview

The rewards system tracks active players in real-time and adjusts reward tiers based on the number of concurrent users. Since we're using **Firestore only** (no Realtime Database), we implement presence through a combination of:

1. **Client-side heartbeats** (every 2 minutes)
2. **Server-side cleanup** (scheduled every 5 minutes)
3. **Real-time Firestore listeners** for instant updates

## Architecture

### Backend Components

#### 1. Presence System (`functions/src/utils/presenceSystem.ts`)

Handles user presence tracking in Firestore:

- `updateUserPresence(userId)` - Updates or creates presence document
- `markUserOffline(userId)` - Marks user as offline
- `getActivePlayerCount()` - Counts active players (online + lastSeen < 5min)
- `cleanupStalePresence()` - Removes stale presence entries

#### 2. Rewards API (`functions/src/routes/rewards.ts`)

Provides rewards information:

- `getRewardsInfo()` - Returns current reward tier, active player count, and stats
- Reward tiers scale from $10 (0-99 players) to $200 (10K+ players)

```typescript
const REWARD_TIERS = [
  {minPlayers: 0, maxPlayers: 99, reward: 10},
  {minPlayers: 100, maxPlayers: 199, reward: 15},
  {minPlayers: 200, maxPlayers: 299, reward: 20},
  {minPlayers: 300, maxPlayers: 499, reward: 25},
  {minPlayers: 500, maxPlayers: 999, reward: 50},
  {minPlayers: 1000, maxPlayers: 1999, reward: 75},
  {minPlayers: 2000, maxPlayers: 4999, reward: 100},
  {minPlayers: 5000, maxPlayers: 9999, reward: 150},
  {minPlayers: 10000, maxPlayers: Infinity, reward: 200},
];
```

#### 3. Cleanup Scheduled Function (`functions/src/scheduled/cleanupPresence.ts`)

Runs every 5 minutes to remove stale presence entries (users who haven't sent heartbeat in 5+ minutes).

### Frontend Components

#### 1. Presence Hook (`src/hooks/use-presence.ts`)

Manages user presence automatically:

```typescript
import {usePresence} from '@/hooks/use-presence';

function App() {
    usePresence(); // Automatically manages presence
    return <YourApp />;
}
```

**Features:**
- Sets user online on mount
- Sends heartbeat every 2 minutes
- Marks user offline on unmount
- Handles tab visibility changes
- Resumes heartbeat when tab becomes visible

#### 2. Rewards Hook (`src/hooks/use-rewards.ts`)

Provides real-time rewards data:

```typescript
import {useRewards} from '@/hooks/use-rewards';

function RewardsScreen() {
    const {rewardsData, loading, error} = useRewards();

    if (loading) return <Loading />;
    if (error) return <Error message={error} />;

    return (
        <View>
            <Text>${rewardsData.currentReward}</Text>
            <Text>{rewardsData.activePlayerCount} players</Text>
            <Text>Next: ${rewardsData.nextReward}</Text>
        </View>
    );
}
```

**Real-time Updates:**
- Listens to `presence` collection with Firestore snapshot listener
- Updates instantly when players join/leave
- Combines real-time count with backend reward tier calculations

## Firestore Structure

### Presence Collection

```
presence/
  {userId}/
    - online: boolean
    - lastSeen: timestamp
    - userId: string
```

### Stats Collection

```
stats/
  rewards/
    - totalPaidOut: number
    - weeklyWinners: array
    - lastWeekWinner: object
```

## Firestore Indexes

Required composite index:

```json
{
  "collectionGroup": "presence",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "online", "mode": "ASCENDING" },
    { "fieldPath": "lastSeen", "mode": "DESCENDING" }
  ]
}
```

## Security Rules

Add to `firestore.rules`:

```
match /presence/{userId} {
  // Users can only write their own presence
  allow write: if request.auth != null && request.auth.uid == userId;
  
  // Anyone can read presence data (for active player count)
  allow read: if request.auth != null;
}

match /stats/{document} {
  // Only authenticated users can read stats
  allow read: if request.auth != null;
  
  // Only backend can write stats
  allow write: if false;
}
```

## How It Works

### When a User Opens the App

1. `usePresence()` hook activates
2. Creates/updates presence document in Firestore
3. Sets `online: true` and `lastSeen: now()`
4. Starts 2-minute heartbeat interval

### Real-Time Updates

1. Rewards screen uses `useRewards()` hook
2. Firestore listener watches presence collection
3. Counts documents where `online == true` AND `lastSeen > 5min ago`
4. UI updates instantly when count changes

### When a User Closes the App

1. `usePresence()` cleanup function runs
2. Marks user as offline in Firestore
3. UI updates for all other users

### Cleanup (Scheduled)

Every 5 minutes, `cleanupStalePresenceScheduled` runs:

1. Finds users with `online == true` but `lastSeen > 5min ago`
2. Marks them as offline
3. Ensures accurate active player count

## Limitations & Tradeoffs

### Without Realtime Database's `onDisconnect()`

**Challenge:** No automatic offline detection when user loses connection

**Solutions:**
- **Heartbeat:** Updates every 2 minutes keep presence alive
- **Scheduled cleanup:** Removes stale entries every 5 minutes
- **Client cleanup:** Marks offline on unmount
- **5-minute threshold:** Users counted as active if seen in last 5 minutes

**Result:** Max 5-minute delay before inactive users are removed from count

### Why Not Use Realtime Database?

While Realtime Database has better presence features (`onDisconnect()`, `.info/connected`), using Firestore-only:

✅ **Simpler architecture** - One database instead of two
✅ **Better querying** - Firestore's rich queries for rewards/stats
✅ **Real-time listeners** - Firestore snapshots work well for our use case
✅ **Acceptable latency** - 5-minute threshold is fine for this app

## Testing

### Test Presence Locally

1. Start emulators: `firebase emulators:start`
2. Open multiple browser tabs
3. Check presence collection for multiple users
4. Close tabs and verify cleanup

### Test Scheduled Function Locally

```bash
cd functions
YARN_IGNORE_ENGINES=true yarn build
firebase emulators:start --only functions
```

The scheduled function will run every 5 minutes in the emulator.

## Deployment

1. Deploy Firestore indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

2. Deploy functions:
   ```bash
   firebase deploy --only functions
   ```

3. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Future Enhancements

- **Weekly winners:** Track and display top contributors
- **Reward history:** Show past reward amounts and winners
- **Push notifications:** Notify users when rewards tier changes
- **Leaderboard:** Show most active times/players

