import React, { useState, useEffect } from 'react'
import { StyleSheet, View, ScrollView } from 'react-native'
import { Text, Button, ActivityIndicator } from 'react-native-paper'
import ScreenLayout from '../components/ScreenLayout'
import RecipeModal from '../components/RecipeModal'
import { ListButton } from '../components/ListButton'
import { useAuth } from '../auth/useAuth'
import { saveRecipeToFirestore, getUserRecipes, deleteRecipeFromFirestore } from '../firebase/recipeUtils'
import type { CreateRecipeFormData } from '../components/RecipeModal'
import type { Recipe } from '../firebase/recipeUtils'

interface RecipeScreenProps {
  activeScreen: string
  onNavigate: (screen: string, data?: any) => void
}

const RecipeScreen: React.FC<RecipeScreenProps> = ({ activeScreen, onNavigate }) => {
  const { user } = useAuth()
  const [recipeModalVisible, setRecipeModalVisible] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)

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
      setRecipeModalVisible(false)
    } catch (error) {
      console.error('Error saving recipe:', error)
    }
  }

  const handleDeleteRecipe = async (id: string) => {
    try {
      await deleteRecipeFromFirestore(id)
      setRecipes(recipes.filter(recipe => recipe.id !== id))
    } catch (error) {
      console.error('Error deleting recipe:', error)
    }
  }

  return (
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate}>
      <Text variant="headlineMedium">Reseptit</Text>
      <Text variant="bodyMedium" style={styles.description}>
        Selaa ja hallinnoi reseptejä.
      </Text>

      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={() => setRecipeModalVisible(true)}>
          Lisää uusi resepti
        </Button>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" />
        </View>
      ) : (
        <ScrollView style={styles.recipeListContainer}>
          {recipes.map((recipe) => (
            <ListButton
              key={recipe.id}
              listName={recipe.title}
              onPress={() => onNavigate('recipe-detail', recipe)}
              onDelete={() => handleDeleteRecipe(recipe.id)}
            />
          ))}
        </ScrollView>
      )}

      <RecipeModal
        visible={recipeModalVisible}
        onClose={() => setRecipeModalVisible(false)}
        onSave={handleSaveRecipe}
      />
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  description: {
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 16,
  },
  recipeListContainer: {
    marginTop: 16,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
})

export default RecipeScreen
