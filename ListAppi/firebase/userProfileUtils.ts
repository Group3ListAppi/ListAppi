import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { auth, db } from "./config"
import { updateProfile } from "firebase/auth"

export type UserProfile = {
  email: string
  emailLower: string
  displayName?: string
  createdAt?: any
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