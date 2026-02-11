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
  quantity?: number
}

export interface ShoplistItemHistory {
  id: string
  userId: string
  shoplistId: string
  text: string
  normalizedText: string
  quantity?: number
  checkedAt?: Date
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
      quantity: data.quantity ?? 1,
      createdAt,
    } as ShoplistItem
  })
}

export const addShoplistItem = async (shoplistId: string, text: string, createdBy?: string | null) => {
  const normalizedText = text.trim().toLowerCase()

  const q = query(itemsCol(shoplistId), where('checked', '==', false))
  const snap = await getDocs(q)

  let existingItem: any = null
  snap.docs.forEach((doc) => {
    const data = doc.data()
    if (data.text?.toLowerCase().trim() === normalizedText) {
      existingItem = { id: doc.id, ...data }
    }
  })

  if (existingItem) {
    const newQuantity = (existingItem.quantity || 1) + 1
    await updateDoc(doc(db, 'shoplists', shoplistId, 'items', existingItem.id), {
      quantity: newQuantity,
    })
    return existingItem.id
  } else {
    const docRef = await addDoc(itemsCol(shoplistId), {
      text,
      checked: false,
      quantity: 1,
      createdAt: serverTimestamp(),
      createdBy: createdBy ?? null,
    })
    return docRef.id
  }
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

const historyCol = () => collection(db, 'shoplistItemHistory')

export const addShoplistItemHistoryEntries = async (
  userId: string,
  shoplistId: string,
  items: Array<{ text: string; quantity?: number }>
) => {
  if (items.length === 0) return

  const batch = writeBatch(db)
  items.forEach((item) => {
    const normalizedText = item.text.trim().replace(/\s+/g, ' ').toLowerCase()
    if (!normalizedText) return

    const docRef = doc(historyCol())
    batch.set(docRef, {
      userId,
      shoplistId,
      text: item.text.trim(),
      normalizedText,
      quantity: Math.max(1, item.quantity ?? 1),
      checkedAt: serverTimestamp(),
    })
  })

  await batch.commit()
}

export const getShoplistItemHistory = async (
  userId: string,
  since: Date
): Promise<ShoplistItemHistory[]> => {
  const q = query(
    historyCol(),
    where('userId', '==', userId),
    where('checkedAt', '>=', since),
    orderBy('checkedAt', 'desc')
  )
  const snap = await getDocs(q)

  return snap.docs.map((d) => {
    const data = d.data() as any
    const checkedAt =
      data.checkedAt instanceof Timestamp
        ? data.checkedAt.toDate()
        : data.checkedAt

    return {
      id: d.id,
      userId: data.userId ?? '',
      shoplistId: data.shoplistId ?? '',
      text: data.text ?? '',
      normalizedText: data.normalizedText ?? '',
      quantity: data.quantity ?? 1,
      checkedAt,
    }
  })
}