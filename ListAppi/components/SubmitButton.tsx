import React from "react";
import { StyleSheet } from "react-native";
import { Button, useTheme } from "react-native-paper";

interface SubmitButtonProps {
  text: string
  onPress: () => void
  disabled?: boolean
  variant?: 'default' | 'danger'
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({ text, onPress, disabled = false, variant = 'default' }) => {
  const theme = useTheme()

  if (variant === 'danger') {
    return (
      <Button
        mode={disabled ? "outlined" : "contained"}
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.button,
          disabled && { borderColor: '#FFB3B3' },
          !disabled && { backgroundColor: '#FFB3B3' }
        ]}
        labelStyle={[styles.label, { color: disabled ? '#FFB3B3' : 'black' }]}
      >
        {text}
      </Button>
    )
  }

  return (
    <Button
      mode={disabled ? "outlined" : "contained"}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        disabled && { borderColor: theme.colors.primaryContainer },
        !disabled && { backgroundColor: theme.colors.primaryContainer }
      ]}
      labelStyle={[styles.label, { color: disabled ? 'white' : 'black' }]}
    >
      {text}
    </Button>
  )
}

const styles = StyleSheet.create({
  button: {
    marginTop: 16,
    paddingVertical: 2,
  },
  label: {
    fontSize: 16,
  },
})
