const LIGHT_COLORS = {
    DEFAULT: '#E8E8E8',
    PRIMARY: '#FF6B00',
    PRIMARY_DARKER: '#FF4500',
    SECONDARY: '#FF0000',
    LABEL: '#FF6B00',
    INFO: '#FF8C00',
    ERROR: '#d8000c',
    SUCCESS: '#4CAF50',
    WARNING: '#FF9800',
    MUTED: '#999',
    INPUT: '#FFFFFF',
    INPUT_BORDER: '#DDD',
    ACTIVE: '#FF6B00',
    BUTTON_COLOR: '#000000',
    BUTTON_TEXT: '#FFFFFF',
    PLACEHOLDER: '#999',
    SWITCH_ON: '#FF6B00',
    SWITCH_OFF: '#DDD',
    GRADIENT_START: '#FF6B00',
    GRADIENT_MID: '#FF4500',
    GRADIENT_END: '#FF0000',
    BORDER_COLOR: '#DDD',
    BLOCK: '#FFFFFF',
    ICON: '#000000',
    TEXT: '#000000',
    TEXT_SECONDARY: '#666',
    LINK: '#FF6B00',
    BACKGROUND: '#E8E8E8',
    CARD_BACKGROUND: '#FFFFFF',
    SHADOW: '#000000',
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    DIVIDER: '#CCC',
    ERROR_BG: '#ffe6e6',
    SUCCESS_BG: '#d4edda',
    tint: '#FF6B00',
    tabIconDefault: '#687076',
    tabIconSelected: '#FF6B00',
};

const DARK_COLORS = {
    DEFAULT: '#1A1A1A',
    PRIMARY: '#FF8C42',
    PRIMARY_DARKER: '#FF6B00',
    SECONDARY: '#FF4500',
    LABEL: '#FF8C42',
    INFO: '#FFA552',
    ERROR: '#ff6b6b',
    SUCCESS: '#66BB6A',
    WARNING: '#FFB74D',
    MUTED: '#888',
    INPUT: '#2C2C2C',
    INPUT_BORDER: '#444',
    ACTIVE: '#FF8C42',
    BUTTON_COLOR: '#FFFFFF',
    BUTTON_TEXT: '#000000',
    PLACEHOLDER: '#888',
    SWITCH_ON: '#FF8C42',
    SWITCH_OFF: '#444',
    GRADIENT_START: '#FF8C42',
    GRADIENT_MID: '#FF6B00',
    GRADIENT_END: '#FF4500',
    BORDER_COLOR: '#444',
    BLOCK: '#2C2C2C',
    ICON: '#FFFFFF',
    TEXT: '#FFFFFF',
    TEXT_SECONDARY: '#AAA',
    LINK: '#FF8C42',
    BACKGROUND: '#121212',
    CARD_BACKGROUND: '#1A1A1A',
    SHADOW: '#000000',
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    DIVIDER: '#444',
    ERROR_BG: '#4a2020',
    SUCCESS_BG: '#2d4a2d',
    tint: '#FF8C42',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FF8C42',
};

export const LIGHT_THEME = {
    COLORS: LIGHT_COLORS,
    SIZES: {
        BLOCK_SHADOW_RADIUS: 2,
    },
    colors: LIGHT_COLORS,
    sizes: {
        BLOCK_SHADOW_RADIUS: 2,
    },
};

export const DARK_THEME = {
    COLORS: DARK_COLORS,
    SIZES: {
        BLOCK_SHADOW_RADIUS: 2,
    },
    colors: DARK_COLORS,
    sizes: {
        BLOCK_SHADOW_RADIUS: 2,
    },
};

export default LIGHT_THEME;

export const getThemeColors = (isDarkMode: boolean) => {
    return isDarkMode ? DARK_COLORS : LIGHT_COLORS;
};

export const Colors = {
    light: LIGHT_COLORS,
    dark: DARK_COLORS,
};
