import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native'
import { Text, useTheme, ActivityIndicator } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import ScreenLayout from '../components/ScreenLayout'
import { ListButton } from '../components/ListButton'
import { SearchBar } from '../components/SearchBar'
import { FilterModal, type FilterOptions } from '../components/FilterModal'
import { getUserRecipes } from '../firebase/recipeUtils'
import { addRecipeToMenuList } from '../firebase/menuUtils'
import type { MenuList } from '../firebase/menuUtils'
import type { Recipe } from '../firebase/recipeUtils'

interface AddRecipeToMenuScreenProps {
  menuList: MenuList
  activeScreen: string
  onNavigate: (screen: string, data?: any) => void
  onBack: () => void
}

const AddRecipeToMenuScreen: React.FC<AddRecipeToMenuScreenProps> = ({
  menuList,
  activeScreen,
  onNavigate,
  onBack,
}) => {
  const theme = useTheme()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    mealTypes: [],
    mainIngredients: [],
    dietTypes: [],
  })

  useEffect(() => {
    loadRecipes()
  }, [menuList.id])

  const loadRecipes = async () => {
    try {
      setLoading(true)
      const userRecipes = await getUserRecipes(menuList.userId)

      const alreadyInMenu = new Set(menuList.recipes.map((r) => r.recipeId))
      const available = userRecipes.filter((r) => !alreadyInMenu.has(r.id))

      setRecipes(available)
      setSelectedRecipeIds([])
    } catch (e) {
      console.error('Error loading recipes:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesSearch =
        recipe.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesMealType =
        filters.mealTypes.length === 0 || (recipe.mealType && filters.mealTypes.includes(recipe.mealType))

      const matchesIngredient =
        filters.mainIngredients.length === 0 ||
        (recipe.mainIngredient && filters.mainIngredients.includes(recipe.mainIngredient))

      const matchesDietType =
        filters.dietTypes.length === 0 ||
        (recipe.dietType && recipe.dietType.some((d) => filters.dietTypes.includes(d)))

      return matchesSearch && matchesMealType && matchesIngredient && matchesDietType
    })
  }, [recipes, searchQuery, filters])

  const toggleSelect = (recipeId: string) => {
    setSelectedRecipeIds((prev) =>
      prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]
    )
  }

  const addSelected = async () => {
    if (selectedRecipeIds.length === 0) return
    try {
      setSaving(true)
      await Promise.all(selectedRecipeIds.map((id) => addRecipeToMenuList(menuList.id, id)))
      onBack()
    } catch (e) {
      console.error('Error adding recipes to menu:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScreenLayout
      activeScreen={activeScreen}
      onNavigate={onNavigate}
      showNav={false}
      showBack={true}
      onBack={onBack}
      customTitle={`Lisää reseptejä: ${menuList.name}`}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : (
        <>
          <View style={styles.searchFilterContainer}>
            <SearchBar
              placeholder="Hae reseptiä..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.8}
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

          <ScrollView style={styles.listContainer}>
            {filteredRecipes.map((recipe) => (
              <ListButton
                key={recipe.id}
                listName={recipe.title}
                imageUrl={recipe.image}
                showCheckbox={true}
                isChecked={selectedRecipeIds.includes(recipe.id)}
                onCheckChange={() => toggleSelect(recipe.id)}
                onPress={() => onNavigate('recipe-detail', recipe)}
              />
            ))}
          </ScrollView>

          {selectedRecipeIds.length > 0 && (
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  { backgroundColor: theme.colors.primary, opacity: saving ? 0.6 : 1 },
                ]}
                onPress={addSelected}
                disabled={saving}
              >
                <Text style={[styles.addButtonText, { color: theme.colors.onPrimary }]}>
                  {saving
                    ? 'Lisätään...'
                    : `Lisää valitut (${selectedRecipeIds.length})`}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <FilterModal
            visible={filterModalVisible}
            onClose={() => setFilterModalVisible(false)}
            onApply={(newFilters) => setFilters(newFilters)}
            selectedFilters={filters}
          />
        </>
      )}
    </ScreenLayout>
  )
}

export default AddRecipeToMenuScreen

const styles = StyleSheet.create({
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
  listContainer: {
    flex: 1,
  },
  bottomBar: {
    padding: 16,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
