import { db } from './config'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  where,
} from 'firebase/firestore'

export interface ShoplistItem {
  id: string
  text: string
  checked: boolean
  createdAt?: Date
}

const itemsCol = (shoplistId: string) =>
  collection(db, 'shoplists', shoplistId, 'items')

export const getShoplistItems = async (shoplistId: string): Promise<ShoplistItem[]> => {
  const q = query(itemsCol(shoplistId), orderBy('createdAt', 'asc'))
  const snap = await getDocs(q)

  return snap.docs.map((d) => {
    const data = d.data() as any
    const createdAt =
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : data.createdAt

    return {
      id: d.id,
      text: data.text ?? '',
      checked: !!data.checked,
      createdAt,
    } as ShoplistItem
  })
}

export const addShoplistItem = async (shoplistId: string, text: string, createdBy?: string | null) => {
  const docRef = await addDoc(itemsCol(shoplistId), {
    text,
    checked: false,
    createdAt: serverTimestamp(),
    createdBy: createdBy ?? null,
  })
  return docRef.id
}

export const setShoplistItemChecked = async (
  shoplistId: string,
  itemId: string,
  checked: boolean
) => {
  await updateDoc(doc(db, 'shoplists', shoplistId, 'items', itemId), {
    checked,
  })
}

export const deleteShoplistItem = async (shoplistId: string, itemId: string) => {
  await deleteDoc(doc(db, 'shoplists', shoplistId, 'items', itemId))
}

export const deleteCheckedShoplistItems = async (shoplistId: string) => {
  // Haetaan vain checked == true itemit
  const q = query(itemsCol(shoplistId), where("checked", "==", true))
  const snap = await getDocs(q)

  if (snap.empty) return 0

  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.delete(d.ref))

  await batch.commit()
  return snap.size // palautetaan montako poistettiin
}