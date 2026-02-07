import { doc, getDoc, serverTimestamp, setDoc, documentId, query, where, getDocs, collection } from "firebase/firestore"
import { auth, db } from "./config"
import { updateProfile } from "firebase/auth"

export type UserProfile = {
  email: string
  emailLower: string
  displayName?: string
  photoURL?: string
  createdAt?: any
  isPremium?: boolean
}

// Varmistaa että users/{uid} olemassa (email + createdAt)
export async function ensureUserProfile(uid: string, email: string | null) {
  await setDoc(
    doc(db, "users", uid),
    {
      email: email ?? "",
      emailLower: (email ?? "").toLowerCase(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  )
}

// Hakee profiilin
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

// Tallentaa displayName
export async function saveMyDisplayName(displayName: string) {
  const user = auth.currentUser
  if (!user) throw new Error("No signed-in user")

  const name = displayName.trim()
  if (name.length < 2) throw new Error("Nimen tulee olla vähintään 2 merkkiä.")

  // 1) Firestore (source of truth)
  await setDoc(doc(db, "users", user.uid), { displayName: name }, { merge: true })

  // 2) Auth-profiili
  await updateProfile(user, { displayName: name })
}

// Aktivoi premium-tilaus
export async function activatePremium() {
  const user = auth.currentUser
  if (!user) throw new Error("No signed-in user")

  await setDoc(doc(db, "users", user.uid), { isPremium: true }, { merge: true })
}

// Peruuta premium-tilaus
export async function cancelPremium() {
  const user = auth.currentUser
  if (!user) throw new Error("No signed-in user")

  await setDoc(doc(db, "users", user.uid), { isPremium: false }, { merge: true })
}

// Päivitä oma sähköposti Firestore-profiiliin
export async function updateMyEmail(email: string) {
  const user = auth.currentUser
  if (!user) throw new Error("No signed-in user")

  const trimmed = email.trim()
  if (!trimmed) throw new Error("Sähköposti ei voi olla tyhjä.")

  await setDoc(
    doc(db, "users", user.uid),
    { email: trimmed, emailLower: trimmed.toLowerCase() },
    { merge: true }
  )
}

// Get multiple user profiles at once
export async function getUserProfiles(userIds: string[]): Promise<Map<string, UserProfile>> {
  const profileMap = new Map<string, UserProfile>()
  
  if (userIds.length === 0) return profileMap
  
  // Firestore 'in' query limit is 10, so batch if needed
  const batches: string[][] = []
  for (let i = 0; i < userIds.length; i += 10) {
    batches.push(userIds.slice(i, i + 10))
  }
  
  for (const batch of batches) {
    const q = query(
      collection(db, 'users'),
      where(documentId(), 'in', batch)
    )
    const snapshot = await getDocs(q)
    snapshot.forEach(doc => {
      profileMap.set(doc.id, doc.data() as UserProfile)
    })
  }
  
  return profileMap
}