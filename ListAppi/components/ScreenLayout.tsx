import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTheme } from 'react-native-paper';
import Navbar from './Navbar';
import AppBar from './AppBar';
import { AddNewButton } from './AddNewButton';
import { logout } from '../auth/signOut';

interface ScreenLayoutProps {
  activeScreen: string
  onNavigate: (screen: string) => void
  children: React.ReactNode
  showFAB?: boolean
  onFABPress?: () => void
  fabLabel?: string
  showNav?: boolean
  showBack?: boolean
  onBack?: () => void
  customTitle?: string
  rightElement?: React.ReactNode
  hideActions?: boolean
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({ activeScreen, onNavigate, children, showFAB = false, onFABPress, fabLabel = '', showNav = true, showBack = false, onBack, customTitle, rightElement, hideActions }) => {
  const theme = useTheme()

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
      Alert.alert("Virhe", "Uloskirjautuminen epäonnistui.");
    }
  };

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
      {showBack ? (
        <AppBar
          title={customTitle || getTitle()}
          onBack={onBack}
          onLogout={handleLogout}
          rightElement={rightElement}
          hideActions={hideActions}
        />
      ) : (
        <AppBar
          title={customTitle || getTitle()}
          onSettings={() => onNavigate("settings")}
          onNotifications={() => onNavigate("notifications")}
          onTrash={() => onNavigate("trash")}
          onLogout={handleLogout}
          rightElement={rightElement}
          hideActions={hideActions}
        />
      )}
      <View style={styles.content}>
        {children}
      </View>
      {showFAB && onFABPress && (
        <View style={styles.fabWrapper}>
          <AddNewButton onPress={onFABPress} label={fabLabel} />
        </View>
      )}
      {showNav && <Navbar activeScreen={activeScreen} onNavigate={onNavigate} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    position: 'relative',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  fabWrapper: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    zIndex: 10,
  },
})

export default ScreenLayout
