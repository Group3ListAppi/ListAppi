import { db } from './config'
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore'
import type { CreateRecipeFormData } from '../components/RecipeModal'

export interface Recipe extends CreateRecipeFormData {
  id: string
  createdAt: Date
}

export const saveRecipeToFirestore = async (
  recipe: CreateRecipeFormData,
  userId: string
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'recipes'), {
      ...recipe,
      userId,
      createdAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving recipe to Firestore:', error)
    throw error
  }
}

export const getUserRecipes = async (userId: string): Promise<Recipe[]> => {
  try {
    const q = query(
      collection(db, 'recipes'),
      where('userId', '==', userId)
    )
    const querySnapshot = await getDocs(q)
    const recipes: Recipe[] = []
    querySnapshot.forEach((doc) => {
      recipes.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      } as Recipe)
    })
    return recipes
  } catch (error) {
    console.error('Error fetching recipes from Firestore:', error)
    throw error
  }
}

export const deleteRecipeFromFirestore = async (recipeId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'recipes', recipeId))
  } catch (error) {
    console.error('Error deleting recipe from Firestore:', error)
    throw error
  }
}
