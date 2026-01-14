import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import ScreenLayout from '../components/ScreenLayout';

interface RecipeScreenProps {
  activeScreen: string
  onNavigate: (screen: string) => void
}

const RecipeScreen: React.FC<RecipeScreenProps> = ({ activeScreen, onNavigate }) => {
  return (
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate}>
      <Text variant="headlineMedium">Reseptit</Text>
      <Text variant="bodyMedium" style={styles.description}>
        Selaa ja hallinnoi reseptejä.
      </Text>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  description: {
    marginTop: 8,
  },
})

export default RecipeScreen
