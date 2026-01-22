import React from "react";
import { StyleSheet } from "react-native";
import { TextInput, useTheme } from "react-native-paper";

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  minHeight?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  minHeight,
}) => {
  const theme = useTheme();

  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      mode="outlined"
      multiline={multiline}
      numberOfLines={numberOfLines}
      style={[
        styles.input,
        multiline && { backgroundColor: "white", color: "black", minHeight },
      ]}
      textColor={multiline ? "black" : undefined}
      outlineColor={theme.colors.primary}
      activeOutlineColor={theme.colors.primary}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    marginBottom: 16,
  },
});
