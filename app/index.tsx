import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth, useTheme } from '@/contexts';

export default function Index() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!user && inAuthGroup) {
      // User is not signed in and trying to access protected route
      router.replace('/login');
    } else if (user && !inAuthGroup) {
      // User is signed in but on login screen
      router.replace('/(tabs)');
    } else if (!user) {
      // User is not signed in, go to login
      router.replace('/login');
    } else {
      // User is signed in, go to tabs
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  // Show loading screen while checking auth state
  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <ActivityIndicator size="large" color={colors.PRIMARY} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

