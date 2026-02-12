import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { useTheme } from "react-native-paper";
import { ListButton } from "../components/ListButton";
import { ActionModal } from "../components/ActionModal";
import { AdBanner } from "../components/AdBanner";
import { getRecipesByIds } from "../firebase/recipeUtils";
import { removeRecipeFromMenuList, toggleRecipeDoneInMenuList, getMenuListById } from "../firebase/menuUtils";
import type { MenuList } from "../firebase/menuUtils";
import type { Recipe } from "../firebase/recipeUtils";
import ScreenLayout from "../components/ScreenLayout";
import { useAuth } from "../auth/useAuth";

interface MenuDetailScreenProps {
  menuList: MenuList;
  activeScreen: string;
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
  isPremium?: boolean;
}

const MenuDetailScreen: React.FC<MenuDetailScreenProps> = ({
  menuList: initialMenuList,
  activeScreen,
  onNavigate,
  onBack,
  isPremium,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menuList, setMenuList] = useState<MenuList>(initialMenuList);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  useEffect(() => {
    if (activeScreen === "menu-detail") {
      loadMenuList();
    }
  }, [activeScreen]);

  const loadMenuList = async () => {
    try {
      const updatedMenuList = await getMenuListById(menuList.id)
      if (!updatedMenuList) return
      setMenuList(updatedMenuList)
      loadRecipes(updatedMenuList)
    } catch (error) {
      console.error('Error loading menu list:', error);
    }
  };

  const loadRecipes = async (currentMenuList = menuList) => {
    const ids = currentMenuList.recipes.map(r => r.recipeId);
    const fetched = await getRecipesByIds(ids)
    setRecipes(fetched)
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
      onFABPress={() => setActionModalVisible(true)}
      hideActions={true}
      fabLabel="Lisää resepti"
    >
      <>
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
          <View style={{ height: 180 }} />
        </ScrollView>
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <AdBanner onPress={() => onNavigate('premium')} isPremium={isPremium} />
        </View>
        <ActionModal
          visible={actionModalVisible}
          onClose={() => setActionModalVisible(false)}
          title={menuList.name}
          actionIds={['createRecipe', 'moveRecipes']}
          onCreateRecipe={() => onNavigate("add-recipe", { menuListId: menuList.id })}
          onMoveRecipes={() => onNavigate("add-recipe-to-menu", menuList)}
        />
      </>
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