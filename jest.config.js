module.exports = {
    preset: 'jest-expo',
    testEnvironment: 'jsdom',
    
    // Exclude functions directory - it has its own Jest config
    testPathIgnorePatterns: [
        '/node_modules/',
        '/functions/',
        '/.expo/',
    ],
    
    // Only look for tests in src and app directories
    roots: ['<rootDir>/src', '<rootDir>/app'],
    
    // Match test files
    testMatch: [
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)',
    ],
    
    // Transform files
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
    ],
    
    // Setup files
    setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
    
    // Module name mapper for aliases
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    
    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        'app/**/*.{js,jsx,ts,tsx}',
        '!**/__tests__/**',
        '!**/node_modules/**',
        '!**/functions/**',
    ],
};

