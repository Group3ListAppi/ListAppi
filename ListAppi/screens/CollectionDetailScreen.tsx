import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, View, TouchableOpacity, Image } from "react-native";
import { Text, ActivityIndicator, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ListButton } from "../components/ListButton";
import { ActionModal } from "../components/ActionModal";
import { AdBanner } from "../components/AdBanner";
import { SearchBar } from '../components/SearchBar';
import { FilterModal, type FilterOptions } from '../components/FilterModal';
import { ToolBar } from '../components/ToolBar';
import { ShareModal } from '../components/ShareModal';
import { getUserRecipes, getRecipesByIds, moveRecipeToTrash, stopSharingRecipe } from "../firebase/recipeUtils";
import { getUserRecipeCollections, removeRecipeFromCollection } from "../firebase/recipeCollectionUtils";
import type { RecipeCollection } from "../firebase/recipeCollectionUtils";
import type { Recipe } from "../firebase/recipeUtils";
import ScreenLayout from "../components/ScreenLayout";
import { useAuth } from "../auth/useAuth";

interface CollectionDetailScreenProps {
  collection: RecipeCollection;
  activeScreen: string;
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
  isPremium?: boolean;
}

const CollectionDetailScreen: React.FC<CollectionDetailScreenProps> = ({
  collection: initialCollection,
  activeScreen,
  onNavigate,
  onBack,
  isPremium,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [collection, setCollection] = useState<RecipeCollection>(initialCollection);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    mealTypes: [],
    mainIngredients: [],
    dietTypes: [],
  });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  useEffect(() => {
    if (activeScreen === "collection-detail" && user?.uid) {
      loadCollection();
    }
  }, [activeScreen, collection.id, user?.uid]);

  const loadCollection = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const userCollections = await getUserRecipeCollections(user.uid);
      const updatedCollection = userCollections.find(c => c.id === collection.id);
      if (updatedCollection) {
        setCollection(updatedCollection);
        await loadRecipes(updatedCollection);
      }
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async (currentCollection = collection) => {
    if (!user?.uid) return;
    // Jaetaan kaikki reseptit kokoelman jäsenille
    // Tämnä mahdollistaa reseptien näyttämisen, vaikka ne eivät olisi käyttäjän omia
    const fetchedRecipes = await getRecipesByIds(currentCollection.recipeIds);
    setRecipes(fetchedRecipes);
  };

  const handleRemoveRecipe = async (recipeId: string) => {
    try {
      await removeRecipeFromCollection(collection.id, recipeId);
      await loadCollection();
    } catch (error) {
      console.error('Error removing recipe from collection:', error);
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    try {
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe || !user?.uid) return;
      
      await moveRecipeToTrash(recipeId, recipe, user.uid, collection.id);
      await removeRecipeFromCollection(collection.id, recipeId);
      await loadCollection();
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const handleStopSharingRecipe = async (recipeId: string) => {
    try {
      if (!user?.uid) return;
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) return;
      
      const isOwner = recipe.userId === user.uid;
      await stopSharingRecipe(recipeId, user.uid, isOwner);
      await loadCollection();
    } catch (error) {
      console.error('Error stopping recipe sharing:', error);
    }
  };

  const handleLongPress = (recipeId: string) => {
    setSelectionMode(true);
    setSelectedRecipes(new Set([recipeId]));
  };

  const handleCheckChange = (recipeId: string, checked: boolean) => {
    setSelectedRecipes((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(recipeId);
      } else {
        newSet.delete(recipeId);
      }
      return newSet;
    });
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedRecipes(new Set());
  };

  const handleMoveRecipes = () => {
    onNavigate('move-recipes-to-collection', {
      sourceCollectionId: collection.id,
      recipeIds: Array.from(selectedRecipes),
    });
    handleCancelSelection();
  };

  const handleMoveSingleRecipe = (recipeId: string) => {
    onNavigate('move-recipes-to-collection', {
      sourceCollectionId: collection.id,
      recipeIds: [recipeId],
    });
  };

  const handleShareRecipes = () => {
    if (selectedRecipes.size > 0) {
      setShareModalVisible(true);
    }
  };

  const handleShareComplete = () => {
    setShareModalVisible(false);
    handleCancelSelection();
  };

  const handleDeleteSelected = async () => {
    try {
      for (const recipeId of selectedRecipes) {
        await removeRecipeFromCollection(collection.id, recipeId);
      }
      await loadCollection();
      handleCancelSelection();
    } catch (error) {
      console.error('Error removing recipes:', error);
    }
  };

  const getFilteredRecipes = () => {
    return recipes.filter((recipe) => {
      const matchesSearch =
        recipe.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesMealType =
        filters.mealTypes.length === 0 || filters.mealTypes.includes(recipe.mealType)

      const matchesIngredient =
        filters.mainIngredients.length === 0 || filters.mainIngredients.includes(recipe.mainIngredient)

      const matchesDietType =
        filters.dietTypes.length === 0 ||
        (recipe.dietType && recipe.dietType.some((d) => filters.dietTypes.includes(d)))

      return matchesSearch && matchesMealType && matchesIngredient && matchesDietType
    })
  }

  return (
    <ScreenLayout 
      activeScreen={activeScreen} 
      onNavigate={onNavigate} 
      showNav={false}
      showBack={true}
      onBack={onBack}
      customTitle={collection.name}
      showFAB={!selectionMode}
      onFABPress={() => setActionModalVisible(true)}
      hideActions={true}
      fabLabel="Luo uusi resepti"
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" />
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={require('../assets/PikkuKokki.png')}
            style={styles.emptyImage}
            resizeMode="contain"
          />
        </View>
      ) : (
        <View style={styles.scrollContainer}>
          <View style={styles.searchFilterContainer}>
            <SearchBar
              placeholder="Hae reseptiä..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setFilterModalVisible(true)}
            >
              <MaterialCommunityIcons
                name="filter-variant"
                size={24}
                color={theme.colors.onPrimary}
              />
              <Text style={[styles.filterButtonText, { color: theme.colors.onPrimary }]}>
                Suodata
              </Text>
            </TouchableOpacity>
          </View>
          {selectionMode && (
            <ToolBar
              selectedCount={selectedRecipes.size}
              onMove={handleMoveRecipes}
              onShare={handleShareRecipes}
              onDelete={handleDeleteSelected}
              onCancel={handleCancelSelection}
            />
          )}
          <ScrollView style={styles.recipeList} contentContainerStyle={styles.recipeListContent}>
            {getFilteredRecipes().map((recipe) => {
              const isOwnedByUser = recipe.userId === user?.uid;
              const isRecipeShared = recipe.sharedWith && recipe.sharedWith.length > 0;
              
              // Everyone in the collection can edit recipes
              // Remove stop sharing option from collection recipes
              const actionIds: string[] = ['shareRecipe', 'moveRecipe', 'editRecipe', 'remove'];
              
              return (
                <ListButton
                  key={recipe.id}
                  listName={recipe.title}
                  imageUrl={recipe.image}
                  ownerAvatar={recipe.ownerAvatar}
                  ownerInitials={recipe.ownerName?.charAt(0).toUpperCase() || "?"}
                  ownerName={recipe.ownerName}
                  isOwnedByUser={isOwnedByUser}
                  isRecipe={true}
                  onPress={() => !selectionMode && onNavigate("recipe-detail", recipe)}
                  onLongPress={() => handleLongPress(recipe.id)}
                  customActionIds={actionIds}
                  onEdit={() => onNavigate('add-recipe', { editRecipe: recipe, collectionId: collection.id })}
                  onMoveRecipe={() => handleMoveSingleRecipe(recipe.id)}
                  onDelete={() => handleRemoveRecipe(recipe.id)}
                  onStopSharing={() => handleStopSharingRecipe(recipe.id)}
                  removeLabel="Poista kokoelmasta"
                  onShareComplete={async () => {}}
                  itemId={recipe.id}
                  itemType="recipe"
                  showCheckbox={selectionMode}
                  isChecked={selectedRecipes.has(recipe.id)}
                  onCheckChange={(checked) => handleCheckChange(recipe.id, checked)}
                />
              );
            })}
            <View style={{ height: 180 }} />
          </ScrollView>
        </View>
      )}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <AdBanner onPress={() => onNavigate('premium')} isPremium={isPremium} />
      </View>
      <ShareModal
        visible={shareModalVisible}
        itemIds={Array.from(selectedRecipes)}
        itemType="recipe"
        onClose={() => setShareModalVisible(false)}
        onShareComplete={handleShareComplete}
        title="Jaa reseptit"
      />
      <ActionModal
        visible={actionModalVisible}
        onClose={() => setActionModalVisible(false)}
        title={collection.name}
        actionIds={['createRecipe', 'moveRecipes']}
        onCreateRecipe={() => onNavigate("add-recipe", { collectionId: collection.id })}
        onMoveRecipes={() => onNavigate("recipes", { pickForCollectionId: collection.id, pickForCollection: collection })}
      />
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        selectedFilters={filters}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImage: {
    width: 300,
    height: 300,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recipeList: {
    flex: 1,
  },
  recipeListContent: {
    paddingBottom: 32,
  },
});

export default CollectionDetailScreen;
