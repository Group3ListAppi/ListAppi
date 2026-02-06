import React, { useState, useEffect } from 'react'
import { StyleSheet, View, ScrollView, Image, TouchableOpacity } from 'react-native'
import { Text, ActivityIndicator, useTheme, SegmentedButtons } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import ScreenLayout from '../components/ScreenLayout'
import { AdBanner } from '../components/AdBanner'
import { ListButton } from '../components/ListButton'
import { SearchBar } from '../components/SearchBar'
import { FilterModal, type FilterOptions } from '../components/FilterModal'
import { ToolBar } from '../components/ToolBar'
import { ShareModal } from '../components/ShareModal'
import ListModal, { type CreateListFormData } from '../components/ListModal'
import { useAuth } from '../auth/useAuth'
import { 
  getUserRecipeCollections, 
  saveRecipeCollectionToFirestore,
  moveRecipeCollectionToTrash,
  stopSharingRecipeCollection,
  deleteRecipeCollection,
  updateRecipeCollectionName,
  type RecipeCollection 
} from '../firebase/recipeCollectionUtils'
import { getRecipesByIds, moveRecipeToTrash, getUserRecipes, stopSharingRecipe, type Recipe } from '../firebase/recipeUtils'
import { getUserProfiles } from '../firebase/userProfileUtils'

interface RecipeScreenProps {
  activeScreen: string;
  onNavigate: (screen: string, data?: any) => void;
  isPremium?: boolean;
}

const RecipeScreen: React.FC<RecipeScreenProps> = ({ activeScreen, onNavigate, isPremium }) => {
  const { user } = useAuth()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [collections, setCollections] = useState<RecipeCollection[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [listModalVisible, setListModalVisible] = useState(false)
  const [editingCollection, setEditingCollection] = useState<RecipeCollection | null>(null)
  const [viewMode, setViewMode] = useState<'collections' | 'recipes'>('collections')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    mealTypes: [],
    mainIngredients: [],
    dietTypes: [],
  })
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set())
  const [shareModalVisible, setShareModalVisible] = useState(false)

  useEffect(() => {
    if (user?.uid && activeScreen === 'recipes') {
      loadCollections()
      loadAllRecipes()
    }
  }, [user?.uid, activeScreen])

  const loadAllRecipes = async () => {
    if (!user?.uid) return
    try {
      const allRecipes = await getUserRecipes(user.uid)
      setRecipes(allRecipes)
    } catch (error) {
      console.error('Error loading recipes:', error)
    }
  }

  const loadCollections = async () => {
    if (!user?.uid) return
    try {
      setLoading(true)
      let userCollections = await getUserRecipeCollections(user.uid)
      
      // Hae omistajien profiilit kaikille kokoelmille
      const ownerIds = [...new Set(userCollections.map(c => c.userId))]
      const ownerProfiles = await getUserProfiles(ownerIds)
      
      // Hae jaettujen käyttäjien profiilit
      const allSharedUserIds = new Set<string>()
      userCollections.forEach(collection => {
        collection.sharedWith?.forEach(id => allSharedUserIds.add(id))
      })
      const sharedUserProfiles = await getUserProfiles([...allSharedUserIds])
      
      // Rikasta kokoelmat omistajatiedoilla ja jaetuilla käyttäjillä
      const enrichedCollections = userCollections.map(collection => ({
        ...collection,
        ownerName: ownerProfiles.get(collection.userId)?.displayName,
        ownerAvatar: ownerProfiles.get(collection.userId)?.photoURL,
        sharedUsers: collection.sharedWith?.map(uid => ({
          displayName: sharedUserProfiles.get(uid)?.displayName,
          photoURL: sharedUserProfiles.get(uid)?.photoURL,
        })) || [],
      }))
      
      setCollections(enrichedCollections)
    } catch (error) {
      console.error('Error loading recipe collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCollection = async (collectionData: CreateListFormData) => {
    if (!user?.uid) return
    try {
      const collectionId = await saveRecipeCollectionToFirestore(collectionData, user.uid)
      const newCollection: RecipeCollection = {
        id: collectionId,
        name: collectionData.name.trim(),
        type: 'recipe-collection',
        userId: user.uid,
        createdAt: new Date(),
        recipeIds: [],
        sharedWith: [],
        sharedUsers: [],
        ownerName: user.displayName || undefined,
        ownerAvatar: user.photoURL || undefined,
      }
      setCollections([...collections, newCollection])
      setListModalVisible(false)
    } catch (error) {
      console.error('Error saving recipe collection:', error)
    }
  }

  const handleRenameCollection = async (collectionData: CreateListFormData) => {
    if (!editingCollection || !user?.uid) return
    try {
      await updateRecipeCollectionName(editingCollection.id, collectionData.name)
      await loadCollections()
    } catch (error) {
      console.error('Error renaming collection:', error)
    } finally {
      setEditingCollection(null)
    }
  }

  const handleDeleteCollection = async (id: string) => {
    try {
      const collectionToDelete = collections.find(c => c.id === id)
      if (collectionToDelete && user?.uid) {
        // Estä oletuskokoelman poistaminen
        if (collectionToDelete.isDefault) {
          return
        }
        
        // Hae kaikki kokoelman reseptit ja poista jako
        const recipes = await getRecipesByIds(collectionToDelete.recipeIds)
        const sharedWith = collectionToDelete.sharedWith || []
        
        // Remove all shared users from all recipes in the collection
        for (const recipe of recipes) {
          try {
            const recipeRef = await import('../firebase/config').then(m => 
              import('firebase/firestore').then(f => f.doc(m.db, 'recipes', recipe.id))
            )
            const { doc, updateDoc } = await import('firebase/firestore')
            const { db } = await import('../firebase/config')
            
            const recipeSharedWith = recipe.sharedWith || []
            
            // Remove all collection shared users from recipe's sharedWith
            const updatedRecipeSharedWith = recipeSharedWith.filter(
              (userId: string) => !sharedWith.includes(userId)
            )
            
            await updateDoc(doc(db, 'recipes', recipe.id), {
              sharedWith: updatedRecipeSharedWith
            })
          } catch (error) {
            console.error(`Error unsharing recipe ${recipe.id}:`, error)
          }
        }
        
        // Poista kokoelma lopullisesti
        await deleteRecipeCollection(id)
        setCollections(collections.filter(c => c.id !== id))
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
    }
  }

  const handleStopSharingCollection = async (id: string) => {
    try {
      const collection = collections.find(c => c.id === id)
      if (collection && user?.uid) {
        const isOwner = collection.userId === user.uid
        await stopSharingRecipeCollection(id, user.uid, isOwner)
        
        if (isOwner) {
          await loadCollections()
        } else {
          setCollections(collections.filter(c => c.id !== id))
        }
      }
    } catch (error) {
      console.error('Error stopping collection sharing:', error)
    }
  }

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.ingredients?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesMealType =
      filters.mealTypes.length === 0 || (recipe.mealType && filters.mealTypes.includes(recipe.mealType))

    const matchesIngredient =
      filters.mainIngredients.length === 0 || (recipe.mainIngredient && filters.mainIngredients.includes(recipe.mainIngredient))

    const matchesDietType =
      filters.dietTypes.length === 0 ||
      (recipe.dietType && recipe.dietType.some((d) => filters.dietTypes.includes(d)))

    return matchesSearch && matchesMealType && matchesIngredient && matchesDietType
  })

  const handleDeleteRecipe = async (recipeId: string) => {
    try {
      const recipe = recipes.find(r => r.id === recipeId)
      if (!recipe || !user?.uid) return
      
      await moveRecipeToTrash(recipeId, recipe, user.uid)
      await loadAllRecipes()
    } catch (error) {
      console.error('Error deleting recipe:', error)
    }
  }

  const handleLongPress = (recipeId: string) => {
    setSelectionMode(true)
    setSelectedRecipes(new Set([recipeId]))
  }

  const handleCheckChange = (recipeId: string, checked: boolean) => {
    setSelectedRecipes((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(recipeId)
      } else {
        newSet.delete(recipeId)
      }
      return newSet
    })
  }

  const handleCancelSelection = () => {
    setSelectionMode(false)
    setSelectedRecipes(new Set())
  }

  const handleShareRecipes = () => {
    if (selectedRecipes.size > 0) {
      setShareModalVisible(true)
    }
  }

  const handleShareComplete = () => {
    setShareModalVisible(false)
    handleCancelSelection()
  }

  const handleMoveRecipes = () => {
    onNavigate('move-recipes-to-collection', {
      recipeIds: Array.from(selectedRecipes),
    })
    handleCancelSelection()
  }

  const handleDeleteSelected = async () => {
    try {
      for (const recipeId of selectedRecipes) {
        const recipe = recipes.find(r => r.id === recipeId)
        if (recipe && user?.uid) {
          if (recipe.userId === user.uid) {
            // Own recipe: move to trash
            await moveRecipeToTrash(recipeId, recipe, user.uid)
          } else {
            // Not own recipe: stop sharing (remove from view)
            await stopSharingRecipe(recipeId, user.uid, false)
          }
        }
      }
      await loadAllRecipes()
      handleCancelSelection()
    } catch (error) {
      console.error('Error deleting recipes:', error)
    }
  }

  return (
    <ScreenLayout 
      activeScreen={activeScreen} 
      onNavigate={onNavigate} 
      fabLabel={viewMode === 'collections' ? "Lisää uusi kokoelma" : "Luo uusi resepti"}
      showFAB={!selectionMode} 
      onFABPress={() => viewMode === 'collections' ? setListModalVisible(true) : onNavigate("add-recipe")}
    >
      <>
        <AdBanner onPress={() => onNavigate('premium')} isPremium={isPremium}/>
        {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" />
        </View>
      ) : (
        <>
          <View style={styles.topContainer}>
            <SegmentedButtons
              value={viewMode}
              onValueChange={(value) => setViewMode(value as 'collections' | 'recipes')}
              buttons={[
                { value: 'collections', label: 'Kokoelmat' },
                { value: 'recipes', label: 'Reseptit' },
              ]}
              style={[
                styles.segmentedButtons, 
                { 
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 20,
                }
              ]}
              theme={{
                colors: {
                  secondaryContainer: theme.colors.primary,
                  onSecondaryContainer: theme.colors.onPrimary,
                  onSurface: theme.colors.onSurface,
                  outline: theme.colors.primary,
                }
              }}
            />
            <View style={styles.searchFilterContainer}>
              <SearchBar
                placeholder={viewMode === 'collections' ? "Hae kokoelmaa..." : "Hae reseptiä..."}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {viewMode === 'recipes' && (
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
              )}
            </View>
          </View>

          {viewMode === 'collections' ? (
            collections.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Image
                  source={require('../assets/PikkuKokki.png')}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <ScrollView style={styles.listContainer}>
                {filteredCollections.map((collection) => (
                  <ListButton
                    key={collection.id}
                    listName={collection.name}
                    ownerAvatar={collection.ownerAvatar}
                    ownerInitials={collection.ownerName?.charAt(0).toUpperCase() || "?"}
                    ownerName={collection.ownerName}
                    sharedUserAvatars={collection.sharedUsers}
                    isOwnedByUser={collection.userId === user?.uid}
                    onPress={() => onNavigate('collection-detail', collection)}
                    onEdit={() => setEditingCollection(collection)}
                    onDelete={() => handleDeleteCollection(collection.id)}
                    onShare={() => {}}
                    onStopSharing={() => handleStopSharingCollection(collection.id)}
                    onShareComplete={() => loadCollections()}
                    itemId={collection.id}
                    itemType="recipeCollection"
                    isDefault={collection.isDefault}
                    shareLabel="Jaa kokoelma"
                    removeLabel="Poista kokoelma"
                    editLabel="Muokkaa nimeä"
                  />
                ))}
              </ScrollView>
            )
          ) : (
            recipes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Image
                  source={require('../assets/PikkuKokki.png')}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={styles.scrollContainer}>
                {selectionMode && (
                  <ToolBar
                    selectedCount={selectedRecipes.size}
                    onMove={handleMoveRecipes}
                    onShare={handleShareRecipes}
                    onDelete={handleDeleteSelected}
                    onCancel={handleCancelSelection}
                  />
                )}
                <ScrollView style={styles.listContainer} contentContainerStyle={{ paddingBottom: 80 }}>
                  {filteredRecipes.map((recipe) => (
                    <ListButton
                      key={recipe.id}
                      listName={recipe.title}
                      imageUrl={recipe.image}
                      ownerAvatar={recipe.ownerAvatar}
                      ownerInitials={recipe.ownerName?.charAt(0).toUpperCase() || "?"}
                      ownerName={recipe.ownerName}
                      isOwnedByUser={recipe.userId === user?.uid}
                      isRecipe={true}
                      onPress={() => !selectionMode && onNavigate("recipe-detail", recipe)}
                      onLongPress={() => handleLongPress(recipe.id)}
                      customActionIds={['shareRecipe', 'editRecipe', 'deleteRecipe']}
                      onEdit={() => onNavigate('add-recipe', { editRecipe: recipe })}
                      onDelete={() => handleDeleteRecipe(recipe.id)}
                      removeLabel="Poista resepti"
                      onShareComplete={async () => {}}
                      itemId={recipe.id}
                      itemType="recipe"
                      showCheckbox={selectionMode}
                      isChecked={selectedRecipes.has(recipe.id)}
                      onCheckChange={(checked) => handleCheckChange(recipe.id, checked)}
                    />
                  ))}
                </ScrollView>
              </View>
            )
          )}
        </>
      )}
      </>
      <ListModal
        visible={listModalVisible || !!editingCollection}
        type="recipe-collection"
        onClose={() => {
          setListModalVisible(false)
          setEditingCollection(null)
        }}
        onSave={editingCollection ? handleRenameCollection : handleSaveCollection}
        initialName={editingCollection?.name}
        title={editingCollection ? "Muokkaa nimeä" : undefined}
      />
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        selectedFilters={filters}
      />
      <ShareModal
        visible={shareModalVisible}
        title="Jaa reseptit"
        itemIds={Array.from(selectedRecipes)}
        itemType="recipe"
        onClose={() => setShareModalVisible(false)}
        onShareComplete={handleShareComplete}
      />
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImage: {
    width: 300,
    height: 300,
  },
  topContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
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
    scrollContainer: {
    flex: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default RecipeScreen
