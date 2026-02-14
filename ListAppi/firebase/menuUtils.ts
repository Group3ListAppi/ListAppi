import { addDoc, collection, deleteDoc, doc, getDocs, getDoc, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "./config";
import { updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import type { CreateListFormData } from "../components/ListModal";

export interface MenuListRecipe {
  recipeId: string;
  done: boolean;
}

export interface MenuList {
    id: string;
    name: string;
    type: "menu"
    userId: string;
    createdAt: Date;
    recipes: MenuListRecipe[];
    ownerName?: string;
    ownerAvatar?: string;
    sharedWith?: string[];
    sharedUsers?: Array<{ displayName?: string; photoURL?: string }>;
}

export const saveMenuListToFirestore = async (
    list: CreateListFormData,
    userId: string 
) => {
    const docRef = await addDoc(collection(db, "menulists"), {
        name: list.name.trim(),
        type: "menu",
        userId,
        recipes: [],
        createdAt: serverTimestamp(),
        sharedWith: [],
    });
    return docRef.id;
}

export const updateMenuListName = async (menuListId: string, newName: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'menulists', menuListId), {
      name: newName.trim(),
    })
  } catch (error) {
    console.error('Error updating menu list name:', error)
    throw error
  }
}

export const getUserMenuLists = async (userId: string): Promise<MenuList[]> => {
  // Kysely valikkolistoista, joissa käyttäjä on omistaja TAI valikkolistat, jotka on jaettu käyttäjälle
  const ownerQuery = query(
    collection(db, "menulists"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const sharedQuery = query(
    collection(db, "menulists"),
    where("sharedWith", "array-contains", userId)
  );
  
  const [ownerSnapshot, sharedSnapshot] = await Promise.all([
    getDocs(ownerQuery),
    getDocs(sharedQuery)
  ]);
  
  const menuLists: MenuList[] = [];
  const menuIds = new Set<string>();
  
  // Prosessoi omistetut valikkolistat
  ownerSnapshot.docs.forEach((d) => {
    const data = d.data() as any;
    if (!data.deletedAt && !menuIds.has(d.id)) {
      menuIds.add(d.id);
      menuLists.push({
        id: d.id,
        name: data.name,
        type: "menu",
        userId: data.userId,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        recipes: (data.recipes || []) as MenuListRecipe[],
        sharedWith: data.sharedWith || [],
      });
    }
  });
  
  // Prosessoi jaetut valikkolistat
  sharedSnapshot.docs.forEach((d) => {
    const data = d.data() as any;
    if (!data.deletedAt && !menuIds.has(d.id)) {
      menuIds.add(d.id);
      menuLists.push({
        id: d.id,
        name: data.name,
        type: "menu",
        userId: data.userId,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        recipes: (data.recipes || []) as MenuListRecipe[],
        sharedWith: data.sharedWith || [],
      });
    }
  });
  
  // Järjestä createdAt:n mukaan laskevasti
  menuLists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  return menuLists;
};

export const getMenuListById = async (menuListId: string): Promise<MenuList | null> => {
  const docSnap = await getDoc(doc(db, 'menulists', menuListId))
  if (!docSnap.exists()) return null

  const data = docSnap.data() as any
  return {
    id: docSnap.id,
    name: data.name,
    type: 'menu',
    userId: data.userId,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    recipes: (data.recipes || []) as MenuListRecipe[],
    sharedWith: data.sharedWith || [],
  } as MenuList
}

  export const addRecipeToMenuList = async (menuListId: string, recipeId: string, updatedBy?: string | null) => {
    const ref = doc(db, "menulists", menuListId);
    await updateDoc(ref, {
      recipes: arrayUnion({ recipeId, done: false }),
      updatedBy: updatedBy ?? null,
      updatedAt: serverTimestamp(),
    });
  }

  export const removeRecipeFromMenuList = async ( menuListId: string, recipe: { recipeId: string; done: boolean }) => {
    const ref = doc(db, "menulists", menuListId);
    await updateDoc(ref, {
      recipes: arrayRemove(recipe),
    });
  }

  export const toggleRecipeDoneInMenuList = async (menuListId: string, recipeId: string, recipes: MenuListRecipe[]) => {
    const item = recipes.find(r => r.recipeId === recipeId);
    if (item) {
      const newItem = { ...item, done: !item.done };
      const ref = doc(db, "menulists", menuListId);
      await updateDoc(ref, {
        recipes: arrayRemove(item),
      });
      await updateDoc(ref, {
        recipes: arrayUnion(newItem),
      });
    }
  }

  export const deleteDoneRecipesFromMenuList = async (
    menuListId: string,
    recipes: MenuListRecipe[],
    updatedBy?: string | null
  ) => {
    const ref = doc(db, "menulists", menuListId)

    const kept = recipes.filter(r => !r.done)

    await updateDoc(ref, {
      recipes: kept,
      updatedBy: updatedBy ?? null,
      updatedAt: serverTimestamp(),
    })

    return recipes.length - kept.length // montako poistettiin
  }


export const moveMenuListToTrash = async (
  menuListId: string,
  menuList: MenuList,
  userId: string
): Promise<void> => {
  try {
    // puhdista valikkolistan data poistamalla rikastetut kentät, jotka saattavat sisältää undefined-arvoja
    const { ownerName, ownerAvatar, sharedUsers, ...cleanMenuData } = menuList
    
    await addDoc(collection(db, 'trash'), {
      type: 'menu',
      menuListId,
      data: cleanMenuData,
      userId,
      deletedAt: new Date(),
    })

    const isOwner = menuList.userId === userId
    if (isOwner) {
      await updateDoc(doc(db, 'menulists', menuListId), {
        deletedAt: new Date(),
      })
    }
  } catch (error) {
    console.error('Error moving menu to trash:', error)
    throw error
  }
}

export const deleteMenuListFromFirestore = async (id: string) => {
  await deleteDoc(doc(db, "menulists", id));
};
export const stopSharingMenuList = async (menuListId: string, userId: string, isOwner: boolean): Promise<void> => {
  try {
    const menuListRef = doc(db, 'menulists', menuListId)
    const menuListDoc = await getDoc(menuListRef)
    
    if (!menuListDoc.exists()) {
      throw new Error('Menu list not found')
    }

    const menuListData = menuListDoc.data()
    const sharedWith = menuListData.sharedWith || []

    if (isOwner) {
      // Owner wants to stop sharing with everyone
      await updateDoc(menuListRef, {
        sharedWith: [],
      })
    } else {
      // Shared user wants to leave
      const updatedSharedWith = sharedWith.filter((id: string) => id !== userId)
      await updateDoc(menuListRef, {
        sharedWith: updatedSharedWith,
      })
    }
  } catch (error) {
    const code = (error as { code?: string })?.code
    if (code === 'permission-denied') {
      return
    }
    console.error('Error stopping menu list sharing:', error)
    throw error
  }
}

export const restoreMenuListFromTrash = async (
  menuListId: string,
  menuListData?: any,
  currentUserId?: string
): Promise<void> => {
  try {
    const listDoc = await getDoc(doc(db, 'menulists', menuListId))
    const ownerId = menuListData?.userId || (listDoc.exists() ? listDoc.data().userId : null)
    const isOwner = currentUserId ? ownerId === currentUserId : true

    if (currentUserId && !isOwner) {
      const q = query(
        collection(db, 'trash'),
        where('menuListId', '==', menuListId),
        where('userId', '==', currentUserId)
      )
      const querySnapshot = await getDocs(q)
      await Promise.all(querySnapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref)))
      return
    }

    // Remove the deletedAt timestamp
    await updateDoc(doc(db, 'menulists', menuListId), {
      deletedAt: null,
    })
    
    // Delete trash entry
    const q = currentUserId
      ? query(
          collection(db, 'trash'),
          where('menuListId', '==', menuListId),
          where('userId', '==', currentUserId)
        )
      : query(
          collection(db, 'trash'),
          where('menuListId', '==', menuListId)
        )
    const querySnapshot = await getDocs(q)
    await Promise.all(querySnapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref)))
  } catch (error) {
    console.error('Error restoring menu list from trash:', error)
    throw error
  }
}

export const permanentlyDeleteMenuList = async (trashItemId: string, menuListId?: string, userId?: string): Promise<void> => {
  try {
    const trashDoc = await getDoc(doc(db, 'trash', trashItemId))
    if (trashDoc.exists() && menuListId && userId) {
      const trashData = trashDoc.data()
      const isOwner = trashData.data?.userId === userId

      if (!isOwner) {
        try {
          await stopSharingMenuList(menuListId, userId, false)
        } catch {
          // Ignore if user no longer has access
        }
        await deleteDoc(doc(db, 'trash', trashItemId))
        return
      }
    }

    // Delete from trash
    await deleteDoc(doc(db, 'trash', trashItemId))
    
    // Also delete from menulists collection if it exists
    if (menuListId) {
      try {
        await deleteDoc(doc(db, 'menulists', menuListId))
      } catch (e) {
        // Item might already be deleted
      }
    }
  } catch (error) {
    console.error('Error permanently deleting menu list:', error)
    throw error
  }
}
