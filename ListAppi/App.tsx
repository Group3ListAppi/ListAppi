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
import AddRecipeScreen from './screens/AddRecipeScreen';
import RecipeDetailScreen from './screens/RecipeDetailScreen';
import MenuDetailScreen from './screens/MenuDetailScreen';
import ShoplistScreen from './screens/ShoplistScreen';
import AuthScreen from './screens/AuthScreen';
import SettingsScreen from './screens/SettingsScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import TrashScreen from './screens/TrashScreen';
import AccountSettingScreen from './screens/AccountSettingScreen';

import { useAuth } from './auth/useAuth'
import type { Recipe } from './firebase/recipeUtils'
import type { MenuList } from './firebase/menuUtils';
import type { CreateRecipeFormData } from './components/RecipeModal'
import { saveRecipeToFirestore, updateRecipeInFirestore } from './firebase/recipeUtils'

export default function App() {
  const { user, initializing } = useAuth();
  const [activeScreen, setActiveScreen] = useState('home')
  const [history, setHistory] = useState<string[]>(["home"]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedMenuList, setSelectedMenuList] = useState<MenuList | null>(null);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

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

  const handleNavigate = (screen: string, data?: any) => {
    if (screen === 'recipe-detail' && data) {
      setSelectedRecipe(data);
    }
    if (screen === 'add-recipe' && data?.editRecipe) {
      setEditRecipe(data.editRecipe);
    } else if (screen === 'add-recipe' && !data?.editRecipe) {
      setEditRecipe(null); // Clear edit mode for new recipe
    }
    if (screen === 'menu-detail' && data) {
      setSelectedMenuList(data);
    }
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

  const handleSaveRecipe = async (recipe: CreateRecipeFormData) => {
    if (!user?.uid) return
    try {
      if (editRecipe) {
        // Update existing recipe
        await updateRecipeInFirestore(editRecipe.id, recipe)
        const updatedRecipes = recipes.map(r => 
          r.id === editRecipe.id 
            ? { ...editRecipe, ...recipe }
            : r
        )
        setRecipes(updatedRecipes)
      } else {
        // Create new recipe
        const recipeId = await saveRecipeToFirestore(recipe, user.uid)
        const newRecipe: Recipe = {
          ...recipe,
          id: recipeId,
          createdAt: new Date(),
        }
        setRecipes([...recipes, newRecipe])
      }
      setEditRecipe(null)
      handleNavigate('recipes')
    } catch (error) {
      console.error('Error saving recipe:', error)
    }
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen activeScreen={activeScreen} onNavigate={handleNavigate} />;
      case 'menu':
        return <MenuScreen activeScreen={activeScreen} onNavigate={handleNavigate} />;
      case 'menu-detail':
        return selectedMenuList ? (
          <MenuDetailScreen
            menuList={selectedMenuList}
            activeScreen={activeScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        ) : null;
      case 'recipes':
        return <RecipeScreen activeScreen={activeScreen} onNavigate={handleNavigate} recipes={recipes} setRecipes={setRecipes} />;
      case 'add-recipe':
        return <AddRecipeScreen onSave={handleSaveRecipe} onBack={handleBack} editRecipe={editRecipe} />;
      case 'recipe-detail':
        return selectedRecipe ? (
          <RecipeDetailScreen
            recipe={selectedRecipe}
            activeScreen={activeScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        ) : null;
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