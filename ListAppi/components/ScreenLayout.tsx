import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import Navbar from './Navbar';
import AppBar from './AppBar';

interface ScreenLayoutProps {
  activeScreen: string
  onNavigate: (screen: string) => void
  children: React.ReactNode
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({ activeScreen, onNavigate, children }) => {
  const theme = useTheme()

  const getTitle = () => {
    switch (activeScreen) {
      case "home":
        return "Etusivu";
      case "menu":
        return "Ruokalistat";
      case "recipes":
        return "Reseptit";
      case "shoplist":
        return "Ostoslista";
      case "settings":
        return "Asetukset";
      case "account-settings":
        return "Tilin asetukset";
      case "notifications":
        return "Ilmoitukset";
      case "trash":
        return "Roskakori";
      default:
        return "";
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppBar
        title={getTitle()}
        onSettings={() => onNavigate("settings")}
        onNotifications={() => onNavigate("notifications")}
        onTrash={() => onNavigate("trash")}
      />
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
    padding: 16,
  },
})

export default ScreenLayout
