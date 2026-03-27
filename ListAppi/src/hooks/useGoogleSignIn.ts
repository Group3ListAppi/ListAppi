import * as WebBrowser from "expo-web-browser"
import * as Google from "expo-auth-session/providers/google"
import * as AuthSession from "expo-auth-session"
import { signInWithGoogleIdToken } from "../api/users/userAuthApi"

WebBrowser.maybeCompleteAuthSession()

export function useGoogleSignIn() {
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true })

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri,
  })

  const signInWithGoogle = async () => {
    const res = await promptAsync()
    if (res.type !== "success") return

    const idToken = (res as any).params?.id_token
    if (!idToken) {
      throw new Error("Google id_token puuttuu (tarkista clientId ja redirectUri).")
    }

    await signInWithGoogleIdToken(idToken)
  }

  return { signInWithGoogle, disabled: !request, lastResponseType: response?.type }
}
