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
  userId: string
  createdAt: Date
  deletedAt?: Date
  ownerName?: string
  ownerAvatar?: string
  sharedWith?: string[]
  sharedUsers?: Array<{ displayName?: string; photoURL?: string }>
}

export interface DeletedItem {
  id: string
  type: 'recipe' | 'shoplist' | 'foodlist' | 'menu' | 'recipe-collection'
  data: Recipe | any
  recipeId?: string
  shoplistId?: string
  menuListId?: string
  collectionId?: string
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
      sharedWith: [],
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving recipe to Firestore:', error)
    throw error
  }
}

export const getUserRecipes = async (userId: string): Promise<Recipe[]> => {
  try {
    // Kysely resepteistä, joissa käyttäjä on omistaja TAI reseptit, jotka on jaettu käyttäjälle
    const ownerQuery = query(
      collection(db, 'recipes'),
      where('userId', '==', userId)
    )
    const sharedQuery = query(
      collection(db, 'recipes'),
      where('sharedWith', 'array-contains', userId)
    )
    
    const [ownerSnapshot, sharedSnapshot] = await Promise.all([
      getDocs(ownerQuery),
      getDocs(sharedQuery)
    ])
    
    const recipes: Recipe[] = []
    const recipeIds = new Set<string>()
    const ownerIds = new Set<string>()
    
    // Prosessoi omistetut reseptit
    ownerSnapshot.forEach((doc) => {
      if (!doc.data().deletedAt && !recipeIds.has(doc.id)) {
        recipeIds.add(doc.id)
        ownerIds.add(doc.data().userId)
        recipes.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        } as Recipe)
      }
    })
    
    // Prosessoi jaetut reseptit
    sharedSnapshot.forEach((doc) => {
      if (!doc.data().deletedAt && !recipeIds.has(doc.id)) {
        recipeIds.add(doc.id)
        ownerIds.add(doc.data().userId)
        recipes.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        } as Recipe)
      }
    })
    
    // Include recipes that are in collections owned by the user
    try {
      const { getUserRecipeCollections } = await import('./recipeCollectionUtils')
      const ownerCollections = await getUserRecipeCollections(userId)
      const collectionRecipeIds = new Set<string>()

      ownerCollections
        .filter(collection => collection.userId === userId)
        .forEach(collection => {
          collection.recipeIds?.forEach(id => collectionRecipeIds.add(id))
        })

      const missingIds = Array.from(collectionRecipeIds).filter(id => !recipeIds.has(id))
      if (missingIds.length > 0) {
        const collectionRecipes = await getRecipesByIds(missingIds)
        collectionRecipes.forEach(recipe => {
          if (!recipeIds.has(recipe.id)) {
            recipeIds.add(recipe.id)
            ownerIds.add(recipe.userId)
            recipes.push(recipe)
          }
        })
      }
    } catch (error) {
      console.error('Error loading collection recipes for user:', error)
    }

    // Fetch owner profiles for all recipes
    if (ownerIds.size > 0) {
      const { getUserProfiles } = await import('./userProfileUtils')
      const profileMap = await getUserProfiles(Array.from(ownerIds))
      
      // Enrich recipes with owner info
      recipes.forEach(recipe => {
        const profile = profileMap.get(recipe.userId)
        if (profile) {
          recipe.ownerName = profile.displayName
          recipe.ownerAvatar = profile.photoURL
        }
      })
    }
    
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
  userId: string,
  collectionId?: string
): Promise<void> => {
  try {
    // Clean the recipe data by removing enriched fields that may contain undefined
    const { ownerName, ownerAvatar, sharedUsers, ...cleanRecipeData } = recipe
    
    await addDoc(collection(db, 'trash'), {
      type: 'recipe',
      recipeId,
      data: cleanRecipeData,
      userId,
      deletedAt: new Date(),
      collectionId: collectionId || null,
    })
    
    // Only soft delete if user is the owner
    const isOwner = recipe.userId === userId
    if (isOwner) {
      await updateDoc(doc(db, 'recipes', recipeId), {
        deletedAt: new Date(),
      })
    }
  } catch (error) {
    console.error('Error moving recipe to trash:', error)
    throw error
  }
}

export const restoreRecipeFromTrash = async (recipeId: string, recipeData?: Recipe | any, collectionId?: string): Promise<void> => {
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

    // Add recipe back to collection if collectionId is provided
    const userId = recipeData?.userId || (recipeDoc.exists() ? recipeDoc.data().userId : null);
    
    if (userId && collectionId) {
      // Import inline to avoid circular dependency
      const { addRecipeToCollection, getUserRecipeCollections } = await import('./recipeCollectionUtils');
      
      try {
        // Check if the collection still exists
        const collectionDoc = await getDoc(doc(db, 'recipeCollections', collectionId));
        if (collectionDoc.exists()) {
          // Add recipe back to the original collection
          await addRecipeToCollection(collectionId, recipeId);
        }
        // If collection doesn't exist, recipe will exist without being in a collection
        // User can see it in the "Reseptit" view and add it to a collection if desired
      } catch (error) {
        console.error('Error adding recipe to collection:', error);
        // Continue even if adding to collection fails - recipe is restored
      }
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
        shoplistId: doc.data().shoplistId,
        menuListId: doc.data().menuListId,
        collectionId: doc.data().collectionId,
        deletedAt: doc.data().deletedAt?.toDate(),
      } as DeletedItem)
    })
    return items
  } catch (error) {
    console.error('Error fetching trash items:', error)
    throw error
  }
}

export const permanentlyDeleteTrashItem = async (trashItemId: string, recipeId?: string, userId?: string): Promise<void> => {
  try {
    // Get the trash item to check ownership
    const trashDoc = await getDoc(doc(db, 'trash', trashItemId))
    
    if (trashDoc.exists() && recipeId && userId) {
      const trashData = trashDoc.data()
      const isOwner = trashData.data?.userId === userId
      
      if (!isOwner) {
        // If not owner, just stop sharing and remove from trash
        await stopSharingRecipe(recipeId, userId, false)
        await deleteDoc(doc(db, 'trash', trashItemId))
        return
      }
    }
    
    // Owner can permanently delete
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

export const stopSharingRecipe = async (recipeId: string, userId: string, isOwner: boolean): Promise<void> => {
  try {
    const recipeRef = doc(db, 'recipes', recipeId)
    const recipeDoc = await getDoc(recipeRef)
    
    if (!recipeDoc.exists()) {
      throw new Error('Recipe not found')
    }

    const recipeData = recipeDoc.data()
    const sharedWith = recipeData.sharedWith || []

    if (isOwner) {
      // Owner wants to stop sharing with everyone
      await updateDoc(recipeRef, {
        sharedWith: [],
      })
    } else {
      // Shared user wants to leave
      const updatedSharedWith = sharedWith.filter((id: string) => id !== userId)
      await updateDoc(recipeRef, {
        sharedWith: updatedSharedWith,
      })
    }
  } catch (error) {
    console.error('Error stopping recipe sharing:', error)
    throw error
  }
}

export const duplicateRecipeToUser = async (recipeId: string, targetUserId: string): Promise<string> => {
  try {
    // Get the source recipe
    const recipeRef = doc(db, 'recipes', recipeId)
    const recipeDoc = await getDoc(recipeRef)
    
    if (!recipeDoc.exists()) {
      throw new Error('Recipe not found')
    }

    const sourceRecipe = recipeDoc.data()
    
    // Remove fields that shouldn't be copied
    const { id, userId, createdAt, deletedAt, sharedWith, ownerName, ownerAvatar, sharedUsers, ...recipeData } = sourceRecipe
    
    // Create the duplicate recipe for the target user
    const newRecipeRef = await addDoc(collection(db, 'recipes'), {
      ...recipeData,
      userId: targetUserId,
      createdAt: new Date(),
      sharedWith: [],
    })
    
    // Get or create the user's default recipe collection
    const { getUserRecipeCollections, addRecipeToCollection } = await import('./recipeCollectionUtils')
    const collections = await getUserRecipeCollections(targetUserId)
    const defaultCollection = collections.find(c => c.isDefault && c.userId === targetUserId)
    
    if (defaultCollection) {
      // Add to default collection
      await addRecipeToCollection(defaultCollection.id, newRecipeRef.id)
    }
    
    console.log(`Recipe ${recipeId} duplicated to user ${targetUserId} as ${newRecipeRef.id}`)
    return newRecipeRef.id
  } catch (error) {
    console.error('Error duplicating recipe to user:', error)
    throw error
  }
}

export const getRecipesByIds = async (recipeIds: string[]): Promise<Recipe[]> => {
  try {
    if (recipeIds.length === 0) return []
    
    const recipes: Recipe[] = []
    const ownerIds = new Set<string>()
    
    // Fetch recipes in batches (Firestore has a limit of 10 for 'in' queries, but we'll fetch individually to be safe)
    for (const recipeId of recipeIds) {
      try {
        const recipeDoc = await getDoc(doc(db, 'recipes', recipeId))
        if (recipeDoc.exists() && !recipeDoc.data().deletedAt) {
          ownerIds.add(recipeDoc.data().userId)
          recipes.push({
            id: recipeDoc.id,
            ...recipeDoc.data(),
            createdAt: recipeDoc.data().createdAt?.toDate(),
          } as Recipe)
        }
      } catch (error) {
        console.error(`Error fetching recipe ${recipeId}:`, error)
        // Continue with other recipes
      }
    }
    
    // Fetch owner profiles for all recipes
    if (ownerIds.size > 0) {
      const { getUserProfiles } = await import('./userProfileUtils')
      const profileMap = await getUserProfiles(Array.from(ownerIds))
      
      // Enrich recipes with owner info
      recipes.forEach(recipe => {
        const profile = profileMap.get(recipe.userId)
        if (profile) {
          recipe.ownerName = profile.displayName
          recipe.ownerAvatar = profile.photoURL
        }
      })
    }
    
    return recipes
  } catch (error) {
    console.error('Error fetching recipes by IDs:', error)
    throw error
  }
}
