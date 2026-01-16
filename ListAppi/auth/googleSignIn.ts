import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../firebase/config";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn() {

  //ei toimi 
 
  //const redirectUri = "https://auth.expo.io/@<expo-username>/listappi"
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri,
  });

  const signInWithGoogle = async () => {
    const res = await promptAsync();
    if (res.type !== "success") return;

    const idToken = (res as any).params?.id_token; // varmistus: eri versioissa params-tyypit voi olla tiukat
    if (!idToken) {
      throw new Error("Google id_token puuttuu (tarkista clientId ja redirectUri).");
    }

    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);
  };

  return { signInWithGoogle, disabled: !request, lastResponseType: response?.type };
}