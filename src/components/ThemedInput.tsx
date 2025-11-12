import React, { forwardRef } from 'react';
import { TextInput, TextInputProps, StyleSheet, Dimensions } from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { useTheme } from '@/contexts';

const { width } = Dimensions.get('screen');
const isTablet = width >= 768;

export const ThemedInput = forwardRef<TextInput, TextInputProps>(
  (props, ref) => {
    const { colors } = useTheme();
    const { style, ...otherProps } = props;

    return (
      <TextInput
        ref={ref}
        style={[
          styles.input,
          {
            backgroundColor: colors.INPUT,
            borderColor: colors.INPUT_BORDER,
            color: colors.TEXT,
            fontSize: isTablet ? moderateScale(10) : moderateScale(13),
            height: verticalScale(44),
            paddingHorizontal: scale(24),
          },
          style,
        ]}
        placeholderTextColor={colors.PLACEHOLDER}
        textAlignVertical='center'
        {...otherProps}
      />
    );
  }
);

ThemedInput.displayName = 'ThemedInput';

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: scale(25),
    marginBottom: scale(10),
    fontWeight: '500',
  },
});

