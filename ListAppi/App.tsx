import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import theme from './theme';
import HomeScreen from './screens/HomeScreen';
import MenuScreen from './screens/MenuScreen';
import RecipeScreen from './screens/RecipeScreen';
import ShoplistScreen from './screens/ShoplistScreen';
import AuthScreen from './screens/AuthScreen';
import SettingsScreen from './screens/SettingsScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import TrashScreen from './screens/TrashScreen';
import AccountSettingScreen from './screens/AccountSettingScreen';

import { useAuth } from './auth/useAuth'

export default function App() {
  const { user, initializing } = useAuth();
  const [activeScreen, setActiveScreen] = useState('home')
  const [history, setHistory] = useState<string[]>(["home"]);

  // Lataa ja käyttää keepScreenOn-asetusta sovelluksen käynnistyessä
  useEffect(() => {
    const applyKeepScreenOnSetting = async () => {
      try {
        const saved = await AsyncStorage.getItem("keepScreenOn");
        if (saved !== null && JSON.parse(saved)) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        }
      } catch (error) {
        console.log("Error applying keepScreenOn setting:", error);
      }
    };
    applyKeepScreenOnSetting();
  }, []);

  const handleNavigate = (screen: string) => {
    setActiveScreen(screen);
    setHistory((prev) => [...prev, screen]);
  };

  const handleBack = () => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev; // ei minnekään takaisin
      const next = prev.slice(0, -1);
      setActiveScreen(next[next.length - 1]);
      return next;
    });
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen activeScreen={activeScreen} onNavigate={handleNavigate} />;
      case 'menu':
        return <MenuScreen activeScreen={activeScreen} onNavigate={handleNavigate} />;
      case 'recipes':
        return <RecipeScreen activeScreen={activeScreen} onNavigate={handleNavigate} />;
      case 'shoplist':
        return <ShoplistScreen activeScreen={activeScreen} onNavigate={handleNavigate} />;
      case "settings":
        return <SettingsScreen activeScreen={activeScreen} onBack={handleBack} onNavigate={handleNavigate} />;
      case "notifications":
        return <NotificationsScreen activeScreen={activeScreen} onBack={handleBack} onNavigate={handleNavigate} />;
      case "trash":
        return <TrashScreen activeScreen={activeScreen} onBack={handleBack} onNavigate={handleNavigate} />;
      case "account-settings":
        return <AccountSettingScreen activeScreen={activeScreen} onBack={handleBack} onNavigate={handleNavigate} />;
      default:
        return <HomeScreen activeScreen={activeScreen} onNavigate={handleNavigate} />;
    }
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
          {initializing ? null : user ? renderScreen() : <AuthScreen />}
          <StatusBar style="light" backgroundColor={theme.colors.background} />
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})