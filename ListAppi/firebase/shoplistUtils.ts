import { db } from './config'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

import type { CreateListFormData } from '../components/ListModal'

export interface Shoplist extends CreateListFormData {
  id: string
  userId: string
  createdAt: Date
  deletedAt?: Date | null
}

export const saveShoplistToFirestore = async (
  list: CreateListFormData,
  userId: string
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'shoplists'), {
      ...list,
      userId,
      createdAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving shoplist to Firestore:', error)
    throw error
  }
}

export const getUserShoplists = async (userId: string): Promise<Shoplist[]> => {
  try {
    const q = query(collection(db, 'shoplists'), where('userId', '==', userId))
    const snap = await getDocs(q)

    const lists: Shoplist[] = []
    snap.forEach((d) => {
      const data = d.data()

      // skip soft-deleted
      if (!data.deletedAt) {
        lists.push({
          id: d.id,
          ...(data as any),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        } as Shoplist)
      }
    })

    return lists
  } catch (error) {
    console.error('Error fetching shoplists from Firestore:', error)
    throw error
  }
}

export const moveShoplistToTrash = async (
  shoplistId: string,
  shoplist: Shoplist,
  userId: string
): Promise<void> => {
  try {
    await addDoc(collection(db, 'trash'), {
      type: 'shoplist',
      shoplistId,
      data: shoplist,
      userId,
      deletedAt: new Date(),
    })

    await updateDoc(doc(db, 'shoplists', shoplistId), {
      deletedAt: new Date(),
    })
  } catch (error) {
    console.error('Error moving shoplist to trash:', error)
    throw error
  }
}

export const restoreShoplistFromTrash = async (
  shoplistId: string,
  shoplistData?: Shoplist | any
): Promise<void> => {
  try {
    const listDoc = await getDoc(doc(db, 'shoplists', shoplistId))

    if (listDoc.exists()) {
      await updateDoc(doc(db, 'shoplists', shoplistId), { deletedAt: null })
    } else if (shoplistData) {
      await setDoc(doc(db, 'shoplists', shoplistId), {
        ...shoplistData,
        deletedAt: null,
      })
    } else {
      throw new Error('Shoplist document not found and no data provided for restoration')
    }

    // remove trash entries
    const q = query(collection(db, 'trash'), where('shoplistId', '==', shoplistId))
    const snap = await getDocs(q)
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  } catch (error) {
    console.error('Error restoring shoplist from trash:', error)
    throw error
  }
}

export const permanentlyDeleteShoplist = async (trashItemId: string, shoplistId?: string) => {
  try {
    await deleteDoc(doc(db, 'trash', trashItemId))
    if (shoplistId) {
      try {
        await deleteDoc(doc(db, 'shoplists', shoplistId))
      } catch {
        // ok if already gone
      }
    }
  } catch (error) {
    console.error('Error permanently deleting shoplist:', error)
    throw error
  }
}