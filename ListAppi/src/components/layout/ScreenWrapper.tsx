// src/components/layout/ScreenWrapper.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

interface Props {
  children: React.ReactNode;
  floatingActionButton?: React.ReactNode;
}

export const ScreenWrapper: React.FC<Props> = ({ children, floatingActionButton }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>{children}</View>
      
      {floatingActionButton && (
        <View style={styles.fabPositioner}>
          {floatingActionButton}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  fabPositioner: {
    position: 'absolute',
    bottom: 70, // Säädä tätä niin, ettei se peitä Navbaria
    right: 16,
    zIndex: 10,
  },
});