import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import { themes, ThemeKey } from './theme';
import HomeScreen from './screens/HomeScreen';
import MenuScreen from './screens/MenuScreen';
import RecipeScreen from './screens/RecipeScreen';
import AddRecipeScreen from './screens/AddRecipeScreen';
import AddRecipeToMenuScreen from './screens/AddRecipeToMenuScreen';
import RecipeDetailScreen from './screens/RecipeDetailScreen';
import MenuDetailScreen from './screens/MenuDetailScreen';
import ShoplistScreen from './screens/ShoplistScreen';
import ShoplistDetailScreen from './screens/ShoplistDetailScreen'
import type { Shoplist } from './firebase/shoplistUtils'
import AuthScreen from './screens/AuthScreen';
import SettingsScreen from './screens/SettingsScreen';
import StyleScreen from './screens/StyleScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import TrashScreen from './screens/TrashScreen';
import AccountSettingScreen from './screens/AccountSettingScreen';

import { useAuth } from './auth/useAuth'
import type { Recipe } from './firebase/recipeUtils'
import type { MenuList } from './firebase/menuUtils';
import type { CreateRecipeFormData } from './components/RecipeModal'
import { saveRecipeToFirestore, updateRecipeInFirestore } from './firebase/recipeUtils'
import ChooseNameScreen from "./screens/ChooseNameScreen"
import { ensureUserProfile, getUserProfile } from "./firebase/userProfileUtils"

export default function App() {
  const { user, initializing } = useAuth();
  const [activeScreen, setActiveScreen] = useState('home')
  const [history, setHistory] = useState<string[]>(["home"]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedMenuList, setSelectedMenuList] = useState<MenuList | null>(null);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedShoplist, setSelectedShoplist] = useState<Shoplist | null>(null)
  const [needsName, setNeedsName] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('dark');

  useEffect(() => {
  const loadTheme = async () => {
    const saved = await AsyncStorage.getItem('selectedTheme');
    if (saved) setSelectedTheme(saved as ThemeKey);
  };
  loadTheme();
}, []);

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

  //Resetoidaan navigaatio/historia uloskirjautuessa
  useEffect(() => {
    if (!initializing && !user) {
      setActiveScreen("home");
      setHistory(["home"]);
      setSelectedRecipe(null);
      setSelectedMenuList(null);
      setSelectedShoplist(null);
      setEditRecipe(null);
      setRecipes([]); 
    }
  }, [user, initializing]);

  //Näyttönimen valinta
  useEffect(() => {
    const run = async () => {
      if (initializing) return

      if (!user) {
        setNeedsName(false)
        setCheckingProfile(false)
        return
      }

      setCheckingProfile(true)
      try {
        await ensureUserProfile(user.uid, user.email ?? null)

        const profile = await getUserProfile(user.uid)
        const hasName = !!profile?.displayName && profile.displayName.trim().length >= 2

        setNeedsName(!hasName)
      } catch (e) {
        console.log("Profile check failed:", e)
        // turvallinen fallback: pakota nimen valinta jos epävarma
        setNeedsName(true)
      } finally {
        setCheckingProfile(false)
      }
    }

    run()
  }, [user, initializing])

  const handleNavigate = (screen: string, data?: any) => {
    if (screen === 'recipe-detail' && data) {
      setSelectedRecipe(data);
    }
    if (screen === 'add-recipe' && data?.editRecipe) {
      setEditRecipe(data.editRecipe);
    } else if (screen === 'add-recipe' && !data?.editRecipe) {
      setEditRecipe(null);
    }
    if ((screen === 'menu-detail' || screen === 'add-recipe-to-menu') && data) {
      setSelectedMenuList(data);
    }
    if (screen === 'shoplist-detail' && data) {
      setSelectedShoplist(data)
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

        await updateRecipeInFirestore(editRecipe.id, recipe)
        const updatedRecipes = recipes.map(r => 
          r.id === editRecipe.id 
            ? { ...editRecipe, ...recipe }
            : r
        )
        setRecipes(updatedRecipes)
      } else {

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
        case 'add-recipe-to-menu':
        return selectedMenuList ? (
          <AddRecipeToMenuScreen
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
      case 'shoplist-detail':
        return selectedShoplist ? (
          <ShoplistDetailScreen
            shoplist={selectedShoplist}
            activeScreen={activeScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        ) : null
      case "settings":
        return <SettingsScreen activeScreen={activeScreen} onBack={handleBack} onNavigate={handleNavigate} />;
      case "StyleScreen":
        return <StyleScreen activeScreen={activeScreen} onBack={handleBack} onNavigate={handleNavigate} onThemeChange={setSelectedTheme} />;
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
      <PaperProvider theme={themes[selectedTheme]}>
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
          {initializing ? null : !user ? (
            <AuthScreen />
          ) : checkingProfile ? null : needsName ? (
            <ChooseNameScreen onDone={() => setNeedsName(false)} />
          ) : (
            renderScreen()
          )}
          <StatusBar style={selectedTheme === 'light' || selectedTheme === 'lightBlue' || selectedTheme === 'lightPurple' ? 'dark' : 'light'} backgroundColor={themes[selectedTheme].colors.background} />
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