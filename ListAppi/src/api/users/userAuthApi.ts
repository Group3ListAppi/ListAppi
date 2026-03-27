import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  arrayRemove,
} from "firebase/firestore"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  reload,
  GoogleAuthProvider,
  signInWithCredential,
  type Auth,
} from "firebase/auth"
import { db, auth } from "../firebase/config"

export const registerWithEmail = async (
  authInstance: Auth,
  email: string,
  password: string
) => {
  const cred = await createUserWithEmailAndPassword(authInstance, email, password)
  await sendEmailVerification(cred.user)
  await signOut(authInstance)
  return cred
}

export const loginWithEmail = async (
  authInstance: Auth,
  email: string,
  password: string
) => {
  const cred = await signInWithEmailAndPassword(authInstance, email, password)
  await reload(cred.user)
  return cred
}

export const resetPassword = async (authInstance: Auth, email: string) => {
  await sendPasswordResetEmail(authInstance, email)
}

export const logout = async () => {
  await signOut(auth)
}

export const signInWithGoogleIdToken = async (idToken: string) => {
  const credential = GoogleAuthProvider.credential(idToken)
  await signInWithCredential(auth, credential)
}


export const deleteUserProfileAndOwnedData = async (uid: string) => {
  // 1) Poista/irrota jaetuista (remove uid sharedWith)
  await removeUidFromSharedWith("shoplists", uid)
  await removeUidFromSharedWith("recipes", uid)
  await removeUidFromSharedWith("recipeCollections", uid)
  await removeUidFromSharedWith("menulists", uid)

  // 2) Poista invitations jossa from/to == uid
  await deleteInvitationsForUser(uid)

  // 3) Poista trash-merkinnät (userId == uid)
  await deleteDocsWhere("trash", "userId", "==", uid)

  // 4) Poista omistetut shoplists + niiden items-subcollection
  await deleteOwnedShoplists(uid)

  // 5) Poista omistetut recipes
  await deleteDocsWhere("recipes", "userId", "==", uid)

  // 6) Poista omistetut recipeCollections
  await deleteDocsWhere("recipeCollections", "userId", "==", uid)

  // 7) Poista omistetut menulists
  await deleteDocsWhere("menulists", "userId", "==", uid)

  // 8) Poista user profile
  await deleteDoc(doc(db, "users", uid))
}

// --- Helpers ---

const removeUidFromSharedWith = async (
  colName: "shoplists" | "recipes" | "recipeCollections" | "menulists",
  uid: string
) => {
  const q = query(collection(db, colName), where("sharedWith", "array-contains", uid))
  const snap = await getDocs(q)
  if (snap.empty) return

  // batcheissa, max 500 ops
  let batch = writeBatch(db)
  let count = 0

  for (const d of snap.docs) {
    batch.update(d.ref, { sharedWith: arrayRemove(uid) })
    count++
    if (count >= 450) {
      await batch.commit()
      batch = writeBatch(db)
      count = 0
    }
  }

  if (count > 0) await batch.commit()
}

const deleteDocsWhere = async (
  colName: string,
  field: string,
  op: "==" | "array-contains",
  value: any
) => {
  const q = query(collection(db, colName), where(field, op as any, value))
  const snap = await getDocs(q)
  if (snap.empty) return

  let batch = writeBatch(db)
  let count = 0

  for (const d of snap.docs) {
    batch.delete(d.ref)
    count++
    if (count >= 450) {
      await batch.commit()
      batch = writeBatch(db)
      count = 0
    }
  }

  if (count > 0) await batch.commit()
}

const deleteOwnedShoplists = async (uid: string) => {
  const q = query(collection(db, "shoplists"), where("userId", "==", uid))
  const snap = await getDocs(q)
  if (snap.empty) return

  for (const listDoc of snap.docs) {
    const shoplistId = listDoc.id

    // 1) delete items subcollection docs
    const itemsSnap = await getDocs(collection(db, "shoplists", shoplistId, "items"))
    if (!itemsSnap.empty) {
      let batch = writeBatch(db)
      let count = 0
      for (const item of itemsSnap.docs) {
        batch.delete(item.ref)
        count++
        if (count >= 450) {
          await batch.commit()
          batch = writeBatch(db)
          count = 0
        }
      }
      if (count > 0) await batch.commit()
    }

    // 2) delete shoplist doc
    await deleteDoc(doc(db, "shoplists", shoplistId))
  }
}

const deleteInvitationsForUser = async (uid: string) => {
  const q1 = query(collection(db, "invitations"), where("fromUserId", "==", uid))
  const q2 = query(collection(db, "invitations"), where("toUserId", "==", uid))

  const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)])

  const docs = [...s1.docs, ...s2.docs]
  if (docs.length === 0) return

  // poistetaan duplikaatit (jos sama doc osuu molempiin)
  const seen = new Set<string>()
  const unique = docs.filter(d => (seen.has(d.id) ? false : (seen.add(d.id), true)))

  let batch = writeBatch(db)
  let count = 0
  for (const d of unique) {
    batch.delete(d.ref)
    count++
    if (count >= 450) {
      await batch.commit()
      batch = writeBatch(db)
      count = 0
    }
  }
  if (count > 0) await batch.commit()
}