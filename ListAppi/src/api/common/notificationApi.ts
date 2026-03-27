import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { Platform } from "react-native"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { auth, db } from "../firebase/config"

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

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null

  const existing = await Notifications.getPermissionsAsync()
  let status = existing.status

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync()
    status = requested.status
  }

  if (status !== "granted") return null

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    })
  }

  const token = await Notifications.getDevicePushTokenAsync()
  return token.data ?? null
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
