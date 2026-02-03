import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { Platform } from "react-native"
import { auth, db } from "./config"

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
