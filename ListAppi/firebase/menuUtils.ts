import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";
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
    });
    return docRef.id;
}

export const getUserMenuLists = async (userId: string): Promise<MenuList[]> => {
  const q = query(
    collection(db, "menulists"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      name: data.name,
      type: "menu",
      userId: data.userId,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      recipes: (data.recipes || []) as MenuListRecipe[],
    };
  });
};

  export const addRecipeToMenuList = async (menuListId: string, recipeId: string) => {
    const ref = doc(db, "menulists", menuListId);
    await updateDoc(ref, {
      recipes: arrayUnion({ recipeId, done: false }),
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


export const deleteMenuListFromFirestore = async (id: string) => {
  await deleteDoc(doc(db, "menulists", id));
};