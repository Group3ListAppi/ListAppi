import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

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
