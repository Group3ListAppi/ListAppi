import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import ScreenLayout from '../components/ScreenLayout';

interface HomeScreenProps {
  activeScreen: string
  onNavigate: (screen: string) => void
}

const HomeScreen: React.FC<HomeScreenProps> = ({ activeScreen, onNavigate }) => {
  return (
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate}>
      <Text variant="headlineMedium">Koti</Text>
      <Text variant="bodyMedium" style={styles.description}>
        Tervetuloa ListAppiin!
      </Text>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  description: {
    marginTop: 8,
  },
})

export default HomeScreen
