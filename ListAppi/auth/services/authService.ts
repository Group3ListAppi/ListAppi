import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  reload,
  type Auth,
} from "firebase/auth";

export const registerWithEmail = async (
  auth: Auth,
  email: string,
  password: string
) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user);
  await signOut(auth);
  return cred;
};

export const loginWithEmail = async (
  auth: Auth,
  email: string,
  password: string
) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await reload(cred.user);
  return cred;
};

export const resetPassword = async (auth: Auth, email: string) => {
  await sendPasswordResetEmail(auth, email);
};