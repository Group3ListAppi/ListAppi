import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import Navbar from './Navbar';

interface ScreenLayoutProps {
  activeScreen: string
  onNavigate: (screen: string) => void
  children: React.ReactNode
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({ activeScreen, onNavigate, children }) => {
  const theme = useTheme()
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {children}
      </View>
      <Navbar activeScreen={activeScreen} onNavigate={onNavigate} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
})

export default ScreenLayout
