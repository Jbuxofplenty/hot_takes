import { useAuth, useTheme } from '@/contexts';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Index() {
    const { loading } = useAuth();
    const { colors } = useTheme();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        // Always navigate to tabs layout - it will handle auth redirect
        router.replace('/(tabs)');
    }, [loading, router]);

    // Show loading screen while checking auth state
    return (
        <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
            <ActivityIndicator size='large' color={colors.PRIMARY} />
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
