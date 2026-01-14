import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import ScreenLayout from '../components/ScreenLayout';

interface ShoplistScreenProps {
  activeScreen: string
  onNavigate: (screen: string) => void
}

const ShoplistScreen: React.FC<ShoplistScreenProps> = ({ activeScreen, onNavigate }) => {
  return (
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate}>
      <Text variant="headlineMedium">Ostoslista</Text>
      <Text variant="bodyMedium" style={styles.description}>
        Hallinnoi ostoslistaasi.
      </Text>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  description: {
    marginTop: 8,
  },
})

export default ShoplistScreen
