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
  ownerName?: string
  ownerAvatar?: string
  sharedWith?: string[]
  sharedUsers?: Array<{ displayName?: string; photoURL?: string }>
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
      sharedWith: [],
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving shoplist to Firestore:', error)
    throw error
  }
}

export const updateShoplistName = async (shoplistId: string, newName: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'shoplists', shoplistId), {
      name: newName.trim(),
    })
  } catch (error) {
    console.error('Error updating shoplist name:', error)
    throw error
  }
}

export const getUserShoplists = async (userId: string): Promise<Shoplist[]> => {
  try {
    // Kysely ostoslistoista, joissa käyttäjä on omistaja TAI ostoslistat, jotka on jaettu käyttäjälle
    const ownerQuery = query(
      collection(db, 'shoplists'),
      where('userId', '==', userId)
    )
    const sharedQuery = query(
      collection(db, 'shoplists'),
      where('sharedWith', 'array-contains', userId)
    )
    
    const [ownerSnapshot, sharedSnapshot] = await Promise.all([
      getDocs(ownerQuery),
      getDocs(sharedQuery)
    ])

    const lists: Shoplist[] = []
    const listIds = new Set<string>()
    
    // Prosessoi omistetut ostoslistat
    ownerSnapshot.forEach((d) => {
      const data = d.data()
      if (!data.deletedAt && !listIds.has(d.id)) {
        listIds.add(d.id)
        lists.push({
          id: d.id,
          ...(data as any),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        } as Shoplist)
      }
    })
    
    // Prosessoi jaetut ostoslistat
    sharedSnapshot.forEach((d) => {
      const data = d.data()
      if (!data.deletedAt && !listIds.has(d.id)) {
        listIds.add(d.id)
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
    // Clean the shoplist data by removing enriched fields that may contain undefined
    const { ownerName, ownerAvatar, sharedUsers, ...cleanShoplistData } = shoplist
    
    await addDoc(collection(db, 'trash'), {
      type: 'shoplist',
      shoplistId,
      data: cleanShoplistData,
      userId,
      deletedAt: new Date(),
    })

    // Only soft delete if user is the owner
    const isOwner = shoplist.userId === userId
    if (isOwner) {
      await updateDoc(doc(db, 'shoplists', shoplistId), {
        deletedAt: new Date(),
      })
    }
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

export const permanentlyDeleteShoplist = async (trashItemId: string, shoplistId?: string, userId?: string) => {
  try {
    // Get the trash item to check ownership
    const trashDoc = await getDoc(doc(db, 'trash', trashItemId))
    
    if (trashDoc.exists() && shoplistId && userId) {
      const trashData = trashDoc.data()
      const isOwner = trashData.data?.userId === userId
      
      if (!isOwner) {
        // If not owner, just stop sharing and remove from trash
        await stopSharingShoplist(shoplistId, userId, false)
        await deleteDoc(doc(db, 'trash', trashItemId))
        return
      }
    }
    
    // Owner can permanently delete
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
export const stopSharingShoplist = async (shoplistId: string, userId: string, isOwner: boolean): Promise<void> => {
  try {
    const shoplistRef = doc(db, 'shoplists', shoplistId)
    const shoplistDoc = await getDoc(shoplistRef)
    
    if (!shoplistDoc.exists()) {
      throw new Error('Shoplist not found')
    }

    const shoplistData = shoplistDoc.data()
    const sharedWith = shoplistData.sharedWith || []

    if (isOwner) {
      // Owner wants to stop sharing with everyone
      await updateDoc(shoplistRef, {
        sharedWith: [],
      })
    } else {
      // Shared user wants to leave
      const updatedSharedWith = sharedWith.filter((id: string) => id !== userId)
      await updateDoc(shoplistRef, {
        sharedWith: updatedSharedWith,
      })
    }
  } catch (error) {
    console.error('Error stopping shoplist sharing:', error)
    throw error
  }
}
