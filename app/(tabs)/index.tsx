import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useTheme } from '@/contexts';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to login after successful logout
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔥</Text>
        <Text style={[styles.title, { color: colors.TEXT }]}>Hot Takes</Text>
        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>Welcome back!</Text>
        
        {user && (
          <View style={[styles.userInfo, { backgroundColor: colors.CARD_BACKGROUND }]}>
            <Text style={[styles.userText, { color: colors.TEXT }]}>
              {user.displayName || user.email || 'User'}
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.BUTTON_COLOR }]} 
          onPress={handleLogout}
        >
          <Text style={[styles.logoutButtonText, { color: colors.BUTTON_TEXT }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 32,
  },
  userInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    minWidth: 200,
    alignItems: 'center',
  },
  userText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
