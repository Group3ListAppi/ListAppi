import { db } from './config'
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
  updateDoc,
  setDoc,
  getDoc,
  Timestamp,
  and,
} from 'firebase/firestore'
import type { CreateRecipeFormData } from '../components/RecipeModal'

export interface Recipe extends CreateRecipeFormData {
  id: string
  createdAt: Date
  deletedAt?: Date
}

export interface DeletedItem {
  id: string
  type: 'recipe' | 'shoplist' | 'foodlist'
  data: Recipe | any
  recipeId?: string
  deletedAt: Date
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
      // Skip soft-deleted recipes (those with deletedAt timestamp)
      if (!doc.data().deletedAt) {
        recipes.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        } as Recipe)
      }
    })
    return recipes
  } catch (error) {
    console.error('Error fetching recipes from Firestore:', error)
    throw error
  }
}

export const updateRecipeInFirestore = async (
  recipeId: string,
  recipe: CreateRecipeFormData
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'recipes', recipeId), {
      ...recipe,
    })
  } catch (error) {
    console.error('Error updating recipe in Firestore:', error)
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

export const moveRecipeToTrash = async (
  recipeId: string,
  recipe: Recipe,
  userId: string
): Promise<void> => {
  try {
    await addDoc(collection(db, 'trash'), {
      type: 'recipe',
      recipeId,
      data: recipe,
      userId,
      deletedAt: new Date(),
    })
    // Soft delete - mark as deleted instead of removing
    await updateDoc(doc(db, 'recipes', recipeId), {
      deletedAt: new Date(),
    })
  } catch (error) {
    console.error('Error moving recipe to trash:', error)
    throw error
  }
}

export const restoreRecipeFromTrash = async (recipeId: string, recipeData?: Recipe | any): Promise<void> => {
  try {
    // Check if recipe document exists
    const recipeDoc = await getDoc(doc(db, 'recipes', recipeId))
    
    if (recipeDoc.exists()) {
      // If it exists, just remove the deletedAt timestamp
      await updateDoc(doc(db, 'recipes', recipeId), {
        deletedAt: null,
      })
    } else if (recipeData) {
      // If it doesn't exist, recreate it from trash data
      await setDoc(doc(db, 'recipes', recipeId), {
        ...recipeData,
        deletedAt: null,
      })
    } else {
      throw new Error('Recipe document not found and no recipe data provided for restoration')
    }
    
    // Delete trash entry
    const q = query(
      collection(db, 'trash'),
      where('recipeId', '==', recipeId)
    )
    const querySnapshot = await getDocs(q)
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref)
    })
  } catch (error) {
    console.error('Error restoring recipe from trash:', error)
    throw error
  }
}

export const getTrashItems = async (userId: string): Promise<DeletedItem[]> => {
  try {
    const q = query(
      collection(db, 'trash'),
      where('userId', '==', userId)
    )
    const querySnapshot = await getDocs(q)
    const items: DeletedItem[] = []
    querySnapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        type: doc.data().type,
        data: doc.data().data,
        recipeId: doc.data().recipeId,
        deletedAt: doc.data().deletedAt?.toDate(),
      } as DeletedItem)
    })
    return items
  } catch (error) {
    console.error('Error fetching trash items:', error)
    throw error
  }
}

export const permanentlyDeleteTrashItem = async (trashItemId: string, recipeId?: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'trash', trashItemId))
    // Also delete from recipes collection if it exists
    if (recipeId) {
      try {
        await deleteDoc(doc(db, 'recipes', recipeId))
      } catch (e) {
        // Item might already be deleted
      }
    }
  } catch (error) {
    console.error('Error permanently deleting trash item:', error)
    throw error
  }
}
