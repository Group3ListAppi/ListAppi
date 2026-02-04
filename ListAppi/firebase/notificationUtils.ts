import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { Platform } from "react-native"
import { auth, db } from "./config"

export type NotificationSettings = {
  pushEnabled: boolean
  pushInvites: boolean
  pushUpdates: boolean
  emailEnabled: boolean
  emailInvites: boolean
  emailUpdates: boolean
}

const defaultNotificationSettings: NotificationSettings = {
  pushEnabled: true,
  pushInvites: true,
  pushUpdates: true,
  emailEnabled: false,
  emailInvites: false,
  emailUpdates: false,
}

export async function savePushToken(token: string) {
  const user = auth.currentUser
  if (!user) throw new Error("No signed-in user")

  const ref = doc(db, "users", user.uid, "notificationTokens", token)
  await setDoc(
    ref,
    {
      token,
      platform: Platform.OS,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export async function getNotificationSettings(userId?: string): Promise<NotificationSettings> {
  const uid = userId ?? auth.currentUser?.uid
  if (!uid) throw new Error("No signed-in user")

  const ref = doc(db, "users", uid, "notificationSettings", "preferences")
  const snap = await getDoc(ref)

  if (!snap.exists()) return { ...defaultNotificationSettings }

  return {
    ...defaultNotificationSettings,
    ...(snap.data() as Partial<NotificationSettings>),
  }
}

export async function saveNotificationSettings(
  updates: Partial<NotificationSettings>,
  userId?: string
) {
  const uid = userId ?? auth.currentUser?.uid
  if (!uid) throw new Error("No signed-in user")

  const ref = doc(db, "users", uid, "notificationSettings", "preferences")
  await setDoc(
    ref,
    {
      ...updates,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}
