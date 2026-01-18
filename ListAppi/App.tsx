import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import theme from './theme';
import HomeScreen from './screens/HomeScreen';
import MenuScreen from './screens/MenuScreen';
import RecipeScreen from './screens/RecipeScreen';
import ShoplistScreen from './screens/ShoplistScreen';
import AuthScreen from './screens/AuthScreen';
import SettingsScreen from './screens/SettingsScreen';

import { useAuth } from './auth/useAuth'

export default function App() {
  const { user, initializing } = useAuth();
  const [activeScreen, setActiveScreen] = useState('home')
  const [history, setHistory] = useState<string[]>(["home"]);

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
        return <SettingsScreen onBack={() => handleNavigate("home")} />;
      default:
        return <HomeScreen activeScreen={activeScreen} onNavigate={handleNavigate} />;
    }
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
          {initializing ? null : user ? renderScreen() : <AuthScreen />}
          <StatusBar style="auto" />
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