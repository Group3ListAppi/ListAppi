import { addDoc, collection, deleteDoc, doc, getDocs, getDoc, orderBy, query, serverTimestamp, where, updateDoc, arrayUnion, arrayRemove, setDoc } from "firebase/firestore";
import { db } from "./config";
import type { CreateListFormData } from "../components/ListModal";

export interface RecipeCollection {
  id: string;
  name: string;
  type: "recipe-collection";
  userId: string;
  createdAt: Date;
  recipeIds: string[];
  isDefault?: boolean;
  ownerName?: string;
  ownerAvatar?: string;
  sharedWith?: string[];
  sharedUsers?: Array<{ displayName?: string; photoURL?: string }>;
}

export const saveRecipeCollectionToFirestore = async (
  collectionData: CreateListFormData,
  userId: string,
  isDefault: boolean = false
) => {
  const docRef = await addDoc(collection(db, "recipeCollections"), {
    name: collectionData.name.trim(),
    type: "recipe-collection",
    userId,
    recipeIds: [],
    createdAt: serverTimestamp(),
    sharedWith: [],
    isDefault,
  });
  return docRef.id;
};

export const getUserRecipeCollections = async (userId: string): Promise<RecipeCollection[]> => {
  const ownerQuery = query(
    collection(db, "recipeCollections"),
    where("userId", "==", userId)
  );
  const sharedQuery = query(
    collection(db, "recipeCollections"),
    where("sharedWith", "array-contains", userId)
  );

  const [ownerSnapshot, sharedSnapshot] = await Promise.all([
    getDocs(ownerQuery),
    getDocs(sharedQuery)
  ]);

  const collections: RecipeCollection[] = [];
  const collectionIds = new Set<string>();

  ownerSnapshot.forEach((doc) => {
    if (!collectionIds.has(doc.id)) {
      collectionIds.add(doc.id);
      collections.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      } as RecipeCollection);
    }
  });

  sharedSnapshot.forEach((doc) => {
    if (!collectionIds.has(doc.id)) {
      collectionIds.add(doc.id);
      collections.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      } as RecipeCollection);
    }
  });

  // Sort by createdAt in JavaScript instead of in the query
  return collections.sort((a, b) => {
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
};

export const updateRecipeCollectionName = async (collectionId: string, newName: string): Promise<void> => {
  try {
    await updateDoc(doc(db, "recipeCollections", collectionId), {
      name: newName,
    });
  } catch (error) {
    console.error('Error updating recipe collection name:', error);
    throw error;
  }
};

export const deleteRecipeCollection = async (collectionId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "recipeCollections", collectionId));
  } catch (error) {
    console.error('Error deleting recipe collection:', error);
    throw error;
  }
};

export const addRecipeToCollection = async (collectionId: string, recipeId: string, updatedBy?: string | null): Promise<void> => {
  try {
    // Get the collection to check who it's shared with
    const collectionDoc = await getDoc(doc(db, "recipeCollections", collectionId));
    if (!collectionDoc.exists()) {
      throw new Error('Collection not found');
    }
    
    const collectionData = collectionDoc.data();
    const collectionOwnerId = collectionData.userId;
    const collectionSharedWith = collectionData.sharedWith || [];
    
    // Add recipe to collection
    await updateDoc(doc(db, "recipeCollections", collectionId), {
      recipeIds: arrayUnion(recipeId),
      updatedBy: updatedBy ?? null,
      updatedAt: serverTimestamp(),
    });
    
    // If collection is shared, share the recipe with all collection members (owner + shared users)
    if (collectionSharedWith.length > 0) {
      const recipeRef = doc(db, "recipes", recipeId);
      const recipeDoc = await getDoc(recipeRef);
      
      if (recipeDoc.exists()) {
        const recipeData = recipeDoc.data();
        const recipeOwnerId = recipeData.userId;
        const recipeSharedWith = recipeData.sharedWith || [];

        if (!updatedBy || updatedBy !== recipeOwnerId) {
          // Only the recipe owner can change sharing for their recipe.
          return;
        }
        
        // Include collection owner and all shared users, but exclude the recipe owner
        const allCollectionMembers = [collectionOwnerId, ...collectionSharedWith];
        const usersToShareWith = allCollectionMembers.filter(id => id !== recipeOwnerId);
        
        // Merge with existing shares and remove duplicates
        const updatedSharedWith = [...new Set([...recipeSharedWith, ...usersToShareWith])];
        
        await updateDoc(recipeRef, {
          sharedWith: updatedSharedWith
        });
      }
    }
  } catch (error) {
    console.error('Error adding recipe to collection:', error);
    throw error;
  }
};

export const removeRecipeFromCollection = async (collectionId: string, recipeId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, "recipeCollections", collectionId), {
      recipeIds: arrayRemove(recipeId)
    });
  } catch (error) {
    console.error('Error removing recipe from collection:', error);
    throw error;
  }
};

export const moveRecipesToCollection = async (sourceCollectionId: string, targetCollectionId: string, recipeIds: string[], updatedBy?: string | null): Promise<void> => {
  try {
    // Add recipes to target collection
    for (const recipeId of recipeIds) {
      await addRecipeToCollection(targetCollectionId, recipeId, updatedBy);
    }
    
    // Remove recipes from source collection
    for (const recipeId of recipeIds) {
      await removeRecipeFromCollection(sourceCollectionId, recipeId);
    }
  } catch (error) {
    console.error('Error moving recipes to collection:', error);
    throw error;
  }
};

export const stopSharingRecipeCollection = async (collectionId: string, userId: string, isOwner: boolean): Promise<void> => {
  try {
    const collectionRef = doc(db, 'recipeCollections', collectionId);
    const collectionDoc = await getDoc(collectionRef);
    
    if (!collectionDoc.exists()) {
      throw new Error('Collection not found');
    }

    const collectionData = collectionDoc.data();
    const sharedWith = collectionData.sharedWith || [];
    const recipeIds = collectionData.recipeIds || [];

    if (isOwner) {
      // Owner stops sharing with everyone
      // First, find and remove all recipes owned by shared users from the collection
      const sharedUsersRecipeIds: string[] = [];
      
      for (const recipeId of recipeIds) {
        try {
          const recipeDoc = await getDoc(doc(db, 'recipes', recipeId));
          if (recipeDoc.exists()) {
            const recipeData = recipeDoc.data();
            // If recipe is owned by any of the shared users, mark it for removal
            if (sharedWith.includes(recipeData.userId)) {
              sharedUsersRecipeIds.push(recipeId);
            }
          }
        } catch (error) {
          console.error(`Error checking recipe ${recipeId}:`, error);
        }
      }
      
      // Remove shared users' recipes from the collection and stop sharing both ways
      const allCollectionMembers = [collectionData.userId, ...sharedWith];

      for (const recipeId of sharedUsersRecipeIds) {
        await removeRecipeFromCollection(collectionId, recipeId);
        
        // Stop sharing these recipes with all collection members (including owner)
        try {
          const recipeRef = doc(db, 'recipes', recipeId);
          const recipeDoc = await getDoc(recipeRef);
          
          if (recipeDoc.exists()) {
            const recipeData = recipeDoc.data();
            const recipeSharedWith = recipeData.sharedWith || [];
            
            // Remove all collection members from this recipe's sharedWith
            const updatedRecipeSharedWith = recipeSharedWith.filter(
              (id: string) => !allCollectionMembers.includes(id)
            );
            
            await updateDoc(recipeRef, {
              sharedWith: updatedRecipeSharedWith
            });
          }
        } catch (error) {
          console.error(`Error unsharing shared user's recipe ${recipeId}:`, error);
        }
      }
      
      // Remove all shared users from remaining recipes in the collection
      for (const recipeId of recipeIds) {
        // Skip recipes we already processed
        if (sharedUsersRecipeIds.includes(recipeId)) continue;
        
        try {
          const recipeRef = doc(db, 'recipes', recipeId);
          const recipeDoc = await getDoc(recipeRef);
          
          if (recipeDoc.exists()) {
            const recipeData = recipeDoc.data();
            const recipeSharedWith = recipeData.sharedWith || [];
            
            // Remove all collection shared users from recipe's sharedWith
            const updatedRecipeSharedWith = recipeSharedWith.filter(
              (id: string) => !sharedWith.includes(id)
            );
            
            await updateDoc(recipeRef, {
              sharedWith: updatedRecipeSharedWith
            });
          }
        } catch (error) {
          console.error(`Error unsharing recipe ${recipeId}:`, error);
        }
      }
      
      await updateDoc(collectionRef, {
        sharedWith: [],
      });
    } else {
      // User is leaving a shared collection
      // Remove this user from all recipes in the collection
      for (const recipeId of recipeIds) {
        try {
          const recipeRef = doc(db, 'recipes', recipeId);
          const recipeDoc = await getDoc(recipeRef);
          
          if (recipeDoc.exists()) {
            const recipeData = recipeDoc.data();
            const recipeSharedWith = recipeData.sharedWith || [];
            
            // Remove leaving user from recipe's sharedWith
            const updatedRecipeSharedWith = recipeSharedWith.filter((id: string) => id !== userId);
            
            await updateDoc(recipeRef, {
              sharedWith: updatedRecipeSharedWith
            });
          }
        } catch (error) {
          console.error(`Error unsharing recipe ${recipeId}:`, error);
        }
      }
      
      // Find recipes in this collection that the user owns and remove them from the collection
      const userOwnedRecipeIds: string[] = [];
      
      for (const recipeId of recipeIds) {
        try {
          const recipeDoc = await getDoc(doc(db, 'recipes', recipeId));
          if (recipeDoc.exists() && recipeDoc.data().userId === userId) {
            userOwnedRecipeIds.push(recipeId);
          }
        } catch (error) {
          console.error(`Error checking recipe ${recipeId}:`, error);
        }
      }
      
      // Remove user's owned recipes from the shared collection
      // and stop sharing them with all collection members
      const allCollectionMembers = [collectionData.userId, ...sharedWith];
      
      for (const recipeId of userOwnedRecipeIds) {
        await removeRecipeFromCollection(collectionId, recipeId);
        
        // Stop sharing this recipe with all collection members
        try {
          const recipeRef = doc(db, 'recipes', recipeId);
          const recipeDoc = await getDoc(recipeRef);
          
          if (recipeDoc.exists()) {
            const recipeData = recipeDoc.data();
            const recipeSharedWith = recipeData.sharedWith || [];
            
            // Remove all collection members from this recipe's sharedWith
            const updatedRecipeSharedWith = recipeSharedWith.filter(
              (id: string) => !allCollectionMembers.includes(id)
            );
            
            await updateDoc(recipeRef, {
              sharedWith: updatedRecipeSharedWith
            });
          }
        } catch (error) {
          console.error(`Error unsharing user's recipe ${recipeId}:`, error);
        }
      }
      
      // Remove user from the collection's sharedWith
      const updatedSharedWith = sharedWith.filter((id: string) => id !== userId);
      await updateDoc(collectionRef, {
        sharedWith: updatedSharedWith,
      });
    }
  } catch (error) {
    const code = (error as { code?: string })?.code
    if (code === 'permission-denied') {
      return
    }
    console.error('Error stopping recipe collection sharing:', error);
    throw error;
  }
};

export const moveRecipeCollectionToTrash = async (
  collectionId: string,
  recipeCollection: RecipeCollection,
  userId: string
): Promise<void> => {
  try {
    const { ownerName, ownerAvatar, sharedUsers, ...cleanCollectionData } = recipeCollection;
    
    await addDoc(collection(db, 'trash'), {
      type: 'recipe-collection',
      collectionId,
      data: cleanCollectionData,
      userId,
      deletedAt: new Date(),
    });

    const isOwner = recipeCollection.userId === userId;
    if (isOwner) {
      await deleteDoc(doc(db, 'recipeCollections', collectionId));
    }
  } catch (error) {
    console.error('Error moving recipe collection to trash:', error);
    throw error;
  }
};

export const restoreRecipeCollectionFromTrash = async (
  collectionId: string,
  collectionData?: RecipeCollection | any,
  currentUserId?: string
): Promise<void> => {
  try {
    const ownerId = collectionData?.userId ?? null
    const isOwner = currentUserId ? ownerId === currentUserId : true

    if (currentUserId && !isOwner) {
      const q = query(
        collection(db, 'trash'),
        where('collectionId', '==', collectionId),
        where('userId', '==', currentUserId)
      )
      const querySnapshot = await getDocs(q)
      await Promise.all(querySnapshot.docs.map((doc) => deleteDoc(doc.ref)))
      return
    }

    // Recreate the collection
    if (collectionData) {
      await setDoc(doc(db, 'recipeCollections', collectionId), {
        ...collectionData,
        deletedAt: null,
      });
    } else {
      throw new Error('Collection data is required for restoration');
    }
    
    // Delete trash entry
    const q = currentUserId
      ? query(
          collection(db, 'trash'),
          where('collectionId', '==', collectionId),
          where('userId', '==', currentUserId)
        )
      : query(
          collection(db, 'trash'),
          where('collectionId', '==', collectionId)
        );
    const querySnapshot = await getDocs(q);
    await Promise.all(querySnapshot.docs.map((doc) => deleteDoc(doc.ref)));
  } catch (error) {
    console.error('Error restoring recipe collection from trash:', error);
    throw error;
  }
};

export const permanentlyDeleteRecipeCollection = async (
  trashItemId: string,
  collectionId?: string,
  userId?: string
): Promise<void> => {
  try {
    const trashDoc = await getDoc(doc(db, 'trash', trashItemId))
    if (trashDoc.exists() && collectionId && userId) {
      const trashData = trashDoc.data()
      const isOwner = trashData.data?.userId === userId

      if (!isOwner) {
        try {
          await stopSharingRecipeCollection(collectionId, userId, false)
        } catch {
          // Ignore if user no longer has access
        }
        await deleteDoc(doc(db, 'trash', trashItemId))
        return
      }
    }

    // Delete trash entry
    await deleteDoc(doc(db, 'trash', trashItemId));
    
    // Delete from recipeCollections if it still exists
    if (collectionId) {
      const collectionDoc = await getDoc(doc(db, 'recipeCollections', collectionId));
      if (collectionDoc.exists()) {
        await deleteDoc(doc(db, 'recipeCollections', collectionId));
      }
    }
  } catch (error) {
    console.error('Error permanently deleting recipe collection:', error);
    throw error;
  }
};
