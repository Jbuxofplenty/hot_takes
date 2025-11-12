import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

import { HapticTab } from '@/components/haptic-tab';
import { useAuth, useTheme } from '@/contexts';

function AuthenticatedTabs({ colors }: { colors: any }) {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.PRIMARY,
                tabBarInactiveTintColor: colors.ICON,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: {
                    backgroundColor: colors.BACKGROUND,
                    borderTopColor: colors.BLACK,
                    borderTopWidth: 2,
                    height: verticalScale(75),
                    paddingBottom: verticalScale(15),
                    paddingTop: verticalScale(12),
                },
                tabBarLabelStyle: {
                    fontSize: moderateScale(10),
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name='wall-of-flame'
                options={{
                    title: 'Wall',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='home-outline' size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name='hall-of-flame'
                options={{
                    title: 'Hall',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='thermometer-outline' size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name='take-creation'
                options={{
                    title: '',
                    tabBarIcon: ({ focused }) => {
                        const buttonSize = scale(56);
                        const iconSize = moderateScale(32);
                        return (
                            <View
                                style={{
                                    width: buttonSize,
                                    height: buttonSize,
                                    borderRadius: buttonSize / 2,
                                    backgroundColor: focused ? colors.PRIMARY : colors.ICON,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Ionicons name='flame' size={iconSize} color={colors.BACKGROUND} />
                            </View>
                        );
                    },
                }}
            />
            <Tabs.Screen
                name='rewards'
                options={{
                    title: 'Rewards',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='trophy-outline' size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name='profile'
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='person-outline' size={size} color={color} />
                    ),
                }}
            />

            {/* Hide the index redirect screen */}
            <Tabs.Screen
                name='index'
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

function UnauthenticatedTabs({ colors }: { colors: any }) {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.PRIMARY,
                tabBarInactiveTintColor: colors.ICON,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: {
                    backgroundColor: colors.BACKGROUND,
                    borderTopColor: colors.BLACK,
                    borderTopWidth: 2,
                    height: verticalScale(75),
                    paddingBottom: verticalScale(15),
                    paddingTop: verticalScale(12),
                },
                tabBarLabelStyle: {
                    fontSize: moderateScale(10),
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name='wall-of-flame'
                options={{
                    title: 'Wall',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='home-outline' size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name='take-creation'
                options={{
                    title: '',
                    tabBarIcon: ({ focused }) => {
                        const buttonSize = scale(56);
                        const iconSize = moderateScale(32);
                        return (
                            <View
                                style={{
                                    width: buttonSize,
                                    height: buttonSize,
                                    borderRadius: buttonSize / 2,
                                    backgroundColor: focused ? colors.PRIMARY : colors.ICON,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Ionicons name='flame' size={iconSize} color={colors.BACKGROUND} />
                            </View>
                        );
                    },
                }}
            />
            <Tabs.Screen
                name='hall-of-flame'
                options={{
                    title: 'Hall',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='thermometer-outline' size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name='rewards'
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name='profile'
                options={{
                    href: null,
                }}
            />

            {/* Hide the index redirect screen */}
            <Tabs.Screen
                name='index'
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

export default function TabLayout() {
    const { colors } = useTheme();
    const { user } = useAuth();

    return user ? <AuthenticatedTabs colors={colors} /> : <UnauthenticatedTabs colors={colors} />;
}
