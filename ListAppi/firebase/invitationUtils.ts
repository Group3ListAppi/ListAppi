import { db } from './config'
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'

export interface Invitation {
  id: string
  fromUserId: string
  fromUserEmail: string
  fromUserDisplayName?: string
  toUserId: string
  toUserEmail: string
  itemId: string
  itemType: 'recipe' | 'recipeCollection' | 'shoplist' | 'menu'
  itemName: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: Date
}

// Löytää käyttäjän sähköpostin perusteella
export const findUserByEmail = async (email: string): Promise<{ uid: string, email: string, displayName?: string } | null> => {
  try {
    const emailLower = email.toLowerCase().trim()
    const q = query(
      collection(db, 'users'),
      where('emailLower', '==', emailLower)
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const userDoc = querySnapshot.docs[0]
    return {
      uid: userDoc.id,
      email: userDoc.data().email,
      displayName: userDoc.data().displayName,
    }
  } catch (error) {
    console.error('Error finding user by email:', error)
    throw error
  }
}

// Lähetä kutsu
export const sendInvitation = async (
  fromUserId: string,
  fromUserEmail: string,
  fromUserDisplayName: string | undefined,
  toUserEmail: string,
  itemId: string,
  itemType: 'recipe' | 'recipeCollection' | 'shoplist' | 'menu',
  itemName: string
): Promise<void> => {
  try {
    // Löytää vastaanottajan käyttäjän sähköpostin perusteella
    const toUser = await findUserByEmail(toUserEmail)
    
    if (!toUser) {
      throw new Error(`Käyttäjää ei löydy sähköpostilla: ${toUserEmail}`)
    }
    
    if (toUser.uid === fromUserId) {
      throw new Error('Et voi lähettää kutsua itsellesi')
    }
    
    // Check if invite already exists
    const q = query(
      collection(db, 'invitations'),
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUser.uid),
      where('itemId', '==', itemId),
      where('status', '==', 'pending')
    )
    const existingInvitations = await getDocs(q)
    
    if (!existingInvitations.empty) {
      throw new Error(`Kutsu on jo lähetetty käyttäjälle: ${toUserEmail}`)
    }
    
    // Tarkista, onko käyttäjällä jo pääsy kohteeseen
    if (itemType !== 'recipeCollection' && itemType !== 'recipe') {
      const collectionName = itemType === 'shoplist' ? 'shoplists' : 'menulists'
      const itemRef = doc(db, collectionName, itemId)
      const itemDoc = await getDoc(itemRef)
      
      if (itemDoc.exists()) {
        const sharedWith = itemDoc.data().sharedWith || []
        if (sharedWith.includes(toUser.uid)) {
          throw new Error(`Käyttäjällä ${toUserEmail} on jo pääsy tähän kohteeseen`)
        }
      }
    }

    if (itemType === 'recipeCollection') {
      const collectionRef = doc(db, 'recipeCollections', itemId)
      const collectionDoc = await getDoc(collectionRef)

      if (!collectionDoc.exists()) {
        throw new Error('Kokoelma ei ole enää saatavilla')
      }

      const collectionData = collectionDoc.data()
      const recipeIds = collectionData.recipeIds || []

      await Promise.all(
        recipeIds.map(async (recipeId: string) => {
          try {
            await updateDoc(doc(db, 'recipes', recipeId), {
              pendingInvitees: arrayUnion(toUser.uid),
            })
          } catch (error) {
            console.error(`Error adding pending invite to recipe ${recipeId}:`, error)
          }
        })
      )

      await updateDoc(collectionRef, {
        pendingInvitees: arrayUnion(toUser.uid),
      })
    } else if (itemType === 'shoplist' || itemType === 'menu') {
      const collectionName = itemType === 'shoplist' ? 'shoplists' : 'menulists'
      await updateDoc(doc(db, collectionName, itemId), {
        pendingInvitees: arrayUnion(toUser.uid),
      })
    }
    
    // Luo kutsu
    await addDoc(collection(db, 'invitations'), {
      fromUserId,
      fromUserEmail,
      fromUserDisplayName: fromUserDisplayName || fromUserEmail,
      toUserId: toUser.uid,
      toUserEmail: toUser.email,
      itemId,
      itemType,
      itemName,
      status: 'pending',
      createdAt: new Date(),
    })
  } catch (error) {
    console.error('Error sending invitation:', error)
    throw error
  }
}

// Hae käyttäjän odottavat kutsut
export const getPendingInvitations = async (userId: string): Promise<Invitation[]> => {
  try {
    const q = query(
      collection(db, 'invitations'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    )
    const querySnapshot = await getDocs(q)
    
    const invitations: Invitation[] = []
    querySnapshot.forEach((doc) => {
      invitations.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      } as Invitation)
    })
    
    return invitations
  } catch (error) {
    console.error('Error fetching invitations:', error)
    throw error
  }
}

// Hyväksy kutsu
export const acceptInvitation = async (invitationId: string): Promise<void> => {
  try {
    // Hae kutsu
    const invitationRef = doc(db, 'invitations', invitationId)
    const invitationDoc = await getDoc(invitationRef)
    
    if (!invitationDoc.exists()) {
      throw new Error('Kutsu ei ole enää voimassa')
    }
    
    const invitation = invitationDoc.data()
    
    if (invitation.itemType === 'recipe') {
      // For recipes, duplicate to recipient's default collection
      const { duplicateRecipeToUser } = await import('./recipeUtils')
      await duplicateRecipeToUser(invitation.itemId, invitation.toUserId)
    } else if (invitation.itemType === 'recipeCollection') {
      // For recipe collections, add user to sharedWith and clear pending invite
      const collectionRef = doc(db, 'recipeCollections', invitation.itemId)
      const collectionDoc = await getDoc(collectionRef)

      if (!collectionDoc.exists()) {
        throw new Error('Kokoelma ei ole enää saatavilla')
      }

      const collectionData = collectionDoc.data()
      const recipeIds = collectionData.recipeIds || []

      for (const recipeId of recipeIds) {
        try {
          const recipeRef = doc(db, 'recipes', recipeId)
          const recipeDoc = await getDoc(recipeRef)

          if (recipeDoc.exists()) {
            await updateDoc(recipeRef, {
              sharedWith: arrayUnion(invitation.toUserId),
              pendingInvitees: arrayRemove(invitation.toUserId),
            })
          }
        } catch (error) {
          console.error(`Error sharing recipe ${recipeId}:`, error)
        }
      }

      await updateDoc(collectionRef, {
        sharedWith: arrayUnion(invitation.toUserId),
        pendingInvitees: arrayRemove(invitation.toUserId),
      })
    } else {
      // For shoplists and menus, add user to sharedWith and clear pending invite
      const collectionName = invitation.itemType === 'shoplist' ? 'shoplists' : 'menulists'
      const itemRef = doc(db, collectionName, invitation.itemId)

      await updateDoc(itemRef, {
        sharedWith: arrayUnion(invitation.toUserId),
        pendingInvitees: arrayRemove(invitation.toUserId),
      })
    }
    
    // Päivitä kutsun tila hyväksytyksi
    await updateDoc(invitationRef, {
      status: 'accepted'
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    throw error
  }
}

// Hylkää kutsu
export const declineInvitation = async (invitationId: string): Promise<void> => {
  try {
    const invitationRef = doc(db, 'invitations', invitationId)
    await updateDoc(invitationRef, {
      status: 'declined'
    })
  } catch (error) {
    console.error('Error declining invitation:', error)
    throw error
  }
}


