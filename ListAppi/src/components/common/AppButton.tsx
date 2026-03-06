// src/components/common/AppButton.tsx
import React from 'react';
import { Button } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface AppButtonProps {
  onPress: () => void;
  label?: string;
  icon?: string;
  mode?: 'contained' | 'outlined' | 'text';
  style?: any;
}

export const AppButton: React.FC<AppButtonProps> = ({ 
  onPress, 
  label, 
  icon, 
  mode = 'contained', 
  style 
}) => (
  <Button
    mode={mode}
    onPress={onPress}
    icon={icon}
    style={[styles.button, style]}
    labelStyle={styles.label}
  >
    {label}
  </Button>
);

const styles = StyleSheet.create({
  button: { borderRadius: 30, height: 56, justifyContent: 'center' },
  label: { color: 'white' },
});