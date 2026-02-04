import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { useTheme } from "react-native-paper";
import { ListButton } from "../components/ListButton";
import { getUserRecipes } from "../firebase/recipeUtils";
import { removeRecipeFromMenuList, toggleRecipeDoneInMenuList, getUserMenuLists } from "../firebase/menuUtils";
import type { MenuList } from "../firebase/menuUtils";
import type { Recipe } from "../firebase/recipeUtils";
import ScreenLayout from "../components/ScreenLayout";
import { useAuth } from "../auth/useAuth";

interface MenuDetailScreenProps {
  menuList: MenuList;
  activeScreen: string;
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
}

const MenuDetailScreen: React.FC<MenuDetailScreenProps> = ({
  menuList: initialMenuList,
  activeScreen,
  onNavigate,
  onBack,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menuList, setMenuList] = useState<MenuList>(initialMenuList);

  useEffect(() => {
    if (activeScreen === "menu-detail") {
      loadMenuList();
    }
  }, [activeScreen]);

  const loadMenuList = async () => {
    try {
      const userMenuLists = await getUserMenuLists(menuList.userId);
      const updatedMenuList = userMenuLists.find(m => m.id === menuList.id);
      if (updatedMenuList) {
        setMenuList(updatedMenuList);
        loadRecipes(updatedMenuList);
      }
    } catch (error) {
      console.error('Error loading menu list:', error);
    }
  };

  const loadRecipes = async (currentMenuList = menuList) => {
    const allUserRecipes = await getUserRecipes(currentMenuList.userId);
    const ids = currentMenuList.recipes.map(r => r.recipeId);
    const filteredRecipes = allUserRecipes.filter(r => ids.includes(r.id));
    setRecipes(filteredRecipes);
  };

  const getRecipeDone = (recipeId: string) => {
    return menuList.recipes.find(r => r.recipeId === recipeId)?.done ?? false;
  };

  const handleToggleDone = async (recipeId: string) => {
    await toggleRecipeDoneInMenuList(menuList.id, recipeId, menuList.recipes);
    loadMenuList();
  };

  const handleRemoveRecipe = async (recipeId: string) => {
    const item = menuList.recipes.find(r => r.recipeId === recipeId);
    if (item) {
      await removeRecipeFromMenuList(menuList.id, item);
      loadMenuList();
    }
  };

  return (
    <ScreenLayout 
      activeScreen={activeScreen} 
      onNavigate={onNavigate} 
      showNav={false}
      showBack={true}
      onBack={onBack}
      customTitle={menuList.name}
      showFAB={true}
      onFABPress={() => onNavigate("add-recipe-to-menu", menuList)}
      hideActions={true}
      fabLabel="Lisää resepti"
    >
      <ScrollView style={styles.container}>
        {recipes.map((recipe) => (
          <ListButton
            key={recipe.id}
            listName={recipe.title}
            imageUrl={recipe.image}
            ownerAvatar={user?.photoURL || undefined}
            ownerInitials={user?.displayName?.charAt(0).toUpperCase() || "U"}
            showCheckbox={true}
            isChecked={getRecipeDone(recipe.id)}
            onCheckChange={() => handleToggleDone(recipe.id)}
            onPress={() => onNavigate("recipe-detail", recipe)}
            customActionIds={['remove']}
            onDelete={() => handleRemoveRecipe(recipe.id)}
            removeLabel="Poista listalta"
          />
        ))}
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 16,
  },
  recipeSelectItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default MenuDetailScreen;