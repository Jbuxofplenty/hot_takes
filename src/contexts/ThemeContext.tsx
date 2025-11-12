import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { getThemeColors } from '../constants/theme';
import { useAuth } from './AuthContext';

interface ThemeContextType {
    isDarkMode: boolean;
    themePreference: 'light' | 'dark' | 'auto';
    setThemePreference: (preference: 'light' | 'dark' | 'auto') => Promise<void>;
    colors: ReturnType<typeof getThemeColors>;
    loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = '@hot_takes_theme';

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const { user } = useAuth();
    const [themePreference, setThemePreferenceState] = useState<'light' | 'dark' | 'auto'>('auto');
    const [colorScheme, setColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
    const [loading, setLoading] = useState(true);

    // Load theme from AsyncStorage on mount
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto')) {
                    setThemePreferenceState(savedTheme);
                }
            } catch (error) {
                console.error('Failed to load theme from storage:', error);
            } finally {
                setLoading(false);
            }
        };
        loadTheme();
    }, []);

    // Listen to system theme changes
    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            setColorScheme(colorScheme);
        });

        return () => subscription.remove();
    }, []);

    // Determine the actual theme to use
    const isDarkMode =
        themePreference === 'auto' ? colorScheme === 'dark' : themePreference === 'dark';

    // Get theme colors based on current mode
    const colors = getThemeColors(isDarkMode);

    // Helper to update theme preference
    const setThemePreference = async (newPreference: 'light' | 'dark' | 'auto') => {
        setThemePreferenceState(newPreference);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newPreference);
        } catch (error) {
            console.error('Failed to save theme to storage:', error);
        }
    };

    const value: ThemeContextType = {
        isDarkMode,
        themePreference,
        setThemePreference,
        colors,
        loading,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

