import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, Image } from "react-native";
import { Text, useTheme, Checkbox, IconButton, Modal, Portal } from "react-native-paper";
import AppBar from "../components/AppBar";
import { ListButton } from "../components/ListButton";
import { AddNewButton } from "../components/AddNewButton";
import { ModalBase } from "../components/ModalBase";
import { getUserRecipes } from "../firebase/recipeUtils";
import { addRecipeToMenuList, removeRecipeFromMenuList, toggleRecipeDoneInMenuList, getUserMenuLists } from "../firebase/menuUtils";
import type { MenuList } from "../firebase/menuUtils";
import type { Recipe } from "../firebase/recipeUtils";

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
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [addRecipeModalVisible, setAddRecipeModalVisible] = useState(false);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [menuList, setMenuList] = useState<MenuList>(initialMenuList);

  useEffect(() => {
    loadMenuList();
    loadAllRecipes();
  }, []);

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

  const loadAllRecipes = async () => {
    const userRecipes = await getUserRecipes(menuList.userId);
    setAllRecipes(userRecipes);
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

  const handleAddRecipe = async (recipeId: string) => {
    const alreadyInMenu = menuList.recipes.some(r => r.recipeId === recipeId);
    if (!alreadyInMenu) {
      await addRecipeToMenuList(menuList.id, recipeId);
      loadMenuList();
    }
    setAddRecipeModalVisible(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <AppBar
        title={menuList.name}
        onBack={onBack}
        onSettings={() => onNavigate("settings")}
        onNotifications={() => onNavigate("notifications")}
      />

      <ScrollView style={styles.container}>
        {recipes.map((recipe) => (
          <ListButton
            key={recipe.id}
            listName={recipe.title}
            imageUrl={recipe.image}
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

      <View style={styles.addButtonWrapper}>
        <AddNewButton
          onPress={() => setAddRecipeModalVisible(true)}
          label="Lisää resepti"
        />
      </View>

      <Portal>
        <Modal visible={addRecipeModalVisible} onDismiss={() => setAddRecipeModalVisible(false)}>
          <ModalBase visible={addRecipeModalVisible} onClose={() => setAddRecipeModalVisible(false)} title="Valitse resepti">
            <ScrollView>
              {allRecipes
                .filter(recipe => !menuList.recipes.some(mr => mr.recipeId === recipe.id))
                .map((recipe) => (
                  <TouchableOpacity
                    key={recipe.id}
                    onPress={() => handleAddRecipe(recipe.id)}
                    style={styles.recipeSelectItem}
                  >
                    <Text>{recipe.title}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </ModalBase>
        </Modal>
      </Portal>
    </View>
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
  addButtonWrapper: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  recipeSelectItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default MenuDetailScreen;