import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "./config";
import type { CreateListFormData } from "../components/ListModal";

export interface MenuList {
    id: string;
    name: string;
    type: "menu"
    userId: string;
    createdAt: Date;
}

export const saveMenuListToFirestore = async (
    list: CreateListFormData,
    userId: string 
) => {
    const docRef = await addDoc(collection(db, "menulists"), {
        name: list.name.trim(),
        type: "menu",
        userId,
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
    };
  });
};

export const deleteMenuListFromFirestore = async (id: string) => {
  await deleteDoc(doc(db, "menulists", id));
};