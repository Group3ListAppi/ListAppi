import React from "react";
import { StyleSheet } from "react-native";
import { Button, useTheme } from "react-native-paper";

interface SubmitButtonProps {
  text: string
  onPress: () => void
  disabled?: boolean
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({ text, onPress, disabled = false }) => {
  const theme = useTheme()

  return (
    <Button
      mode="contained"
      onPress={onPress}
      disabled={disabled}
      style={styles.button}
      labelStyle={styles.label}
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
