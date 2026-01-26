import React, { useState, useEffect } from 'react'
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native'
import { Text, ActivityIndicator, useTheme } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import ScreenLayout from '../components/ScreenLayout'
import { AddNewButton } from '../components/AddNewButton'
import { ListButton } from '../components/ListButton'
import { SearchBar } from '../components/SearchBar'
import { useAuth } from '../auth/useAuth'
import { saveRecipeToFirestore, getUserRecipes, moveRecipeToTrash } from '../firebase/recipeUtils'
import { FilterModal, type FilterOptions } from '../components/FilterModal'
import type { CreateRecipeFormData } from '../components/RecipeModal'
import type { Recipe } from '../firebase/recipeUtils'

interface RecipeScreenProps {
  activeScreen: string
  onNavigate: (screen: string, data?: any) => void
  recipes: Recipe[]
  setRecipes: (recipes: Recipe[]) => void
}

const RecipeScreen: React.FC<RecipeScreenProps> = ({ activeScreen, onNavigate, recipes, setRecipes }) => {
  const { user } = useAuth()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    mealTypes: [],
    mainIngredients: [],
    dietTypes: [],
  })

  useEffect(() => {
    if (user?.uid) {
      loadRecipes()
    }
  }, [user?.uid])

  const loadRecipes = async () => {
    if (!user?.uid) return
    try {
      setLoading(true)
      const userRecipes = await getUserRecipes(user.uid)
      setRecipes(userRecipes)
    } catch (error) {
      console.error('Error loading recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRecipe = async (recipe: CreateRecipeFormData) => {
    if (!user?.uid) return
    try {
      const recipeId = await saveRecipeToFirestore(recipe, user.uid)
      const newRecipe: Recipe = {
        ...recipe,
        id: recipeId,
        createdAt: new Date(),
      }
      setRecipes([...recipes, newRecipe])
      onNavigate('recipe')
    } catch (error) {
      console.error('Error saving recipe:', error)
    }
  }

  const handleDeleteRecipe = async (id: string) => {
    try {
      const recipeToDelete = recipes.find(r => r.id === id)
      if (recipeToDelete && user?.uid) {
        await moveRecipeToTrash(id, recipeToDelete, user.uid)
        setRecipes(recipes.filter(recipe => recipe.id !== id))
      }
    } catch (error) {
      console.error('Error deleting recipe:', error)
    }
  }

  const getFilteredRecipes = () => {
    return recipes.filter((recipe) => {
      const matchesSearch =
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate} fabLabel="Lisää uusi resepti" showFAB={true} onFABPress={() => onNavigate('add-recipe')}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" />
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="headlineMedium">Reseptit</Text>
          <Text variant="bodyMedium" style={styles.description}>
            Selaa ja hallinnoi reseptejä.
          </Text>

          <AddNewButton
            onPress={() => onNavigate('add-recipe')}
            label="Lisää uusi resepti"
            animate={false}
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
          <ScrollView style={styles.recipeListContainer}>
            {getFilteredRecipes().map((recipe) => (
              <ListButton
                key={recipe.id}
                listName={recipe.title}
                imageUrl={recipe.image}
                ownerAvatar={user?.photoURL || undefined}
                ownerInitials={user?.displayName?.charAt(0).toUpperCase() || "U"}
                isRecipe={true}
                onPress={() => onNavigate('recipe-detail', recipe)}
                onEdit={() => onNavigate('add-recipe', { editRecipe: recipe })}
                onDelete={() => handleDeleteRecipe(recipe.id)}
                onShare={() => {
                }}
              />
            ))}
          </ScrollView>
        </View>
      )}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        selectedFilters={filters}
      />
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
  },
  description: {
    marginTop: 8,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    position: 'relative',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
  },
  searchbar: {
    flex: 1,
    height: 40,
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
  recipeListContainer: {
    flex: 1,
  },
  floatingButtonWrapper: {
    position: 'absolute',
    bottom: 50,
    right: 16,
    alignItems: 'center',
  },
  buttonWrapper: {
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default RecipeScreen
