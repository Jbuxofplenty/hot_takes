import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

export default function RewardsScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.BLACK }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.ERROR }]}>Rewards</Text>
          <Text style={[styles.headerSubtitle, { color: colors.TEXT }]}>Hot Takes</Text>
        </View>
        <Ionicons name="trophy-outline" size={moderateScale(28)} color={colors.PRIMARY} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.TEXT }]}>
          CURRENT WEEKLY REWARD FOR THE HOTTEST TAKE
        </Text>

        <Text style={[styles.rewardAmount, { color: colors.TEXT }]}>
          $20.00
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.BLACK }]} />

        <View style={styles.statsRow}>
          <Text style={[styles.statsLabel, { color: colors.TEXT }]}>
            CURRENT ACTIVE PLAYERS:
          </Text>
          <Text style={[styles.statsValue, { color: colors.TEXT }]}>238</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.BLACK }]} />

        <View style={styles.nextRewardSection}>
          <Text style={[styles.sectionLabel, { color: colors.TEXT }]}>
            NEXT REWARD:
          </Text>
          <Text style={[styles.smallLabel, { color: colors.TEXT_SECONDARY }]}>
            62 MORE PLAYERS FOR THE NEXT TIER TO UNLOCK
          </Text>
          <Text style={[styles.nextRewardAmount, { color: colors.TEXT }]}>$25</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.BLACK }]} />

        <TouchableOpacity
          style={[styles.inviteButton, { backgroundColor: colors.BUTTON_COLOR }]}
        >
          <Text style={[styles.inviteButtonText, { color: colors.BUTTON_TEXT }]}>
            INVITE YOUR FRIENDS
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(16),
    borderBottomWidth: 2,
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: scale(20),
  },
  sectionLabel: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: verticalScale(16),
  },
  rewardAmount: {
    fontSize: moderateScale(56),
    fontWeight: 'bold',
    marginBottom: verticalScale(24),
  },
  divider: {
    height: 1,
    marginVertical: verticalScale(24),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  statsValue: {
    fontSize: moderateScale(32),
    fontWeight: 'bold',
  },
  nextRewardSection: {
    marginBottom: verticalScale(24),
  },
  smallLabel: {
    fontSize: moderateScale(11),
    marginBottom: verticalScale(12),
  },
  nextRewardAmount: {
    fontSize: moderateScale(36),
    fontWeight: 'bold',
  },
  inviteButton: {
    paddingVertical: verticalScale(16),
    borderRadius: scale(25),
    alignItems: 'center',
    marginTop: verticalScale(24),
  },
  inviteButtonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

