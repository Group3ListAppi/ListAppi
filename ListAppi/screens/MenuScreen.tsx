import React from 'react';
import { Text } from 'react-native-paper';
import ScreenLayout from '../components/ScreenLayout';

interface MenuScreenProps {
  activeScreen: string
  onNavigate: (screen: string) => void
}

const MenuScreen: React.FC<MenuScreenProps> = ({ activeScreen, onNavigate }) => {
  return (
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate}>
      <Text variant="headlineMedium">Ruokalistat</Text>
      <Text variant="bodyMedium">
        Hallinnoi ruokailistaasi tässä.
      </Text>
    </ScreenLayout>
  )
}

export default MenuScreen
