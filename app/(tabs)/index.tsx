import { Redirect } from 'expo-router';

// Redirect to take-creation tab as the default landing page
export default function TabIndex() {
  return <Redirect href="/(tabs)/take-creation" />;
}

