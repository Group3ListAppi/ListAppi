import React, { useState, useEffect, useMemo } from "react";
import { Alert, StyleSheet, ScrollView, View, TouchableOpacity } from "react-native";
import { useTheme, Text } from "react-native-paper";
import { ListButton } from "../components/ListButton";
import { ActionModal } from "../components/ActionModal";
import { AdBanner } from "../components/AdBanner";
import { getRecipesByIds } from "../firebase/recipeUtils";
import { removeRecipeFromMenuList, toggleRecipeDoneInMenuList, getMenuListById, deleteDoneRecipesFromMenuList } from "../firebase/menuUtils";
import type { MenuList } from "../firebase/menuUtils";
import type { Recipe } from "../firebase/recipeUtils";
import ScreenLayout from "../components/ScreenLayout";
import { useAuth } from "../auth/useAuth";
import { MaterialCommunityIcons } from "@expo/vector-icons"

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
  const [doneCollapsed, setDoneCollapsed] = useState(true)

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

  const removeDoneRecipes = () => {
    const doneCount = menuList.recipes.filter(r => r.done).length
    if (doneCount === 0) return

    Alert.alert(
      "Poistetaanko tehdyt ruoat?",
      `Olet poistamassa ${doneCount} tehtyä reseptiä tältä ruokalistalta.`,
      [
        { text: "Peruuta", style: "cancel" },
        {
          text: "Poista",
          style: "destructive",
          onPress: async () => {
            const backup = menuList

            // optimistinen UI: poistetaan tehdyt paikallisesti heti
            setMenuList(prev => ({
              ...prev,
              recipes: prev.recipes.filter(r => !r.done),
            }))

            try {
              await deleteDoneRecipesFromMenuList(menuList.id, menuList.recipes, user?.uid ?? null)
              loadMenuList()
            } catch (e) {
              console.error("Error removing done recipes:", e)
              setMenuList(backup) // rollback
            }
          },
        },
      ],
      { cancelable: true }
    )
  }

  const activeRecipes = useMemo(
    () => recipes.filter(r => !getRecipeDone(r.id)),
    [recipes, menuList]
  )

  const doneRecipes = useMemo(
    () => recipes.filter(r => getRecipeDone(r.id)),
    [recipes, menuList]
  )

  const doneCount = doneRecipes.length

  

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
          {/* Aktiiviset */}
          {activeRecipes.map((recipe) => (
            <ListButton
              key={recipe.id}
              listName={recipe.title}
              imageUrl={recipe.image}
              ownerAvatar={user?.photoURL || undefined}
              ownerInitials={user?.displayName?.charAt(0).toUpperCase() || "U"}
              showCheckbox={true}
              isChecked={false}
              onCheckChange={() => handleToggleDone(recipe.id)}
              onPress={() => onNavigate("recipe-detail", recipe)}
              customActionIds={['remove']}
              onDelete={() => handleRemoveRecipe(recipe.id)}
              removeLabel="Poista listalta"
              doneStyle={false}
            />
          ))}

          {/* Tehdyt collapsible */}
          {doneCount > 0 && (
            <TouchableOpacity
              onPress={() => setDoneCollapsed(v => !v)}
              style={[styles.doneHeader, { borderColor: theme.colors.outlineVariant }]}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontWeight: "700" }}>
                  Tehdyt ({doneCount})
                </Text>

                <TouchableOpacity
                  onPress={removeDoneRecipes}
                  activeOpacity={0.7}
                  style={[styles.clearDoneBtn, { borderColor: theme.colors.outlineVariant }]}
                >
                  <Text style={{ color: theme.colors.onSurfaceVariant, fontWeight: "700" }}>
                    Poista
                  </Text>
                </TouchableOpacity>
              </View>

              <MaterialCommunityIcons
                name={doneCollapsed ? "chevron-down" : "chevron-up"}
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}

          {!doneCollapsed && doneRecipes.map((recipe) => (
            <ListButton
              key={recipe.id}
              listName={recipe.title}
              imageUrl={recipe.image}
              ownerAvatar={user?.photoURL || undefined}
              ownerInitials={user?.displayName?.charAt(0).toUpperCase() || "U"}
              showCheckbox={true}
              isChecked={true}
              onCheckChange={() => handleToggleDone(recipe.id)}
              onPress={() => onNavigate("recipe-detail", recipe)}
              customActionIds={['remove']}
              onDelete={() => handleRemoveRecipe(recipe.id)}
              removeLabel="Poista listalta"
              doneStyle={true}
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
  doneHeader: {
    marginTop: 8,
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clearDoneBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});

export default MenuDetailScreen;