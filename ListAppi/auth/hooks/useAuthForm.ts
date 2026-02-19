import { useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { loginWithEmail, registerWithEmail } from "../services/authService";
import { mapAuthError } from "../services/authErrors";

export type Mode = "login" | "register";

export const useAuthForm = (auth: Auth) => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailTrimmed = email.trim();

  const emailValid = useMemo(() => {
    return emailTrimmed.length === 0 || /\S+@\S+\.\S+/.test(emailTrimmed);
  }, [emailTrimmed]);

  const passwordValid = useMemo(() => {
    return password.length === 0 || password.length >= 6;
  }, [password]);

  const canSubmit =
    emailTrimmed.length > 0 &&
    password.length > 0 &&
    emailValid &&
    passwordValid;

  const toggleMode = () => {
    setError(null);
    setMode((m) => (m === "login" ? "register" : "login"));
  };

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        await registerWithEmail(auth, emailTrimmed, password);
        setMode("login");
        setError(
          "Vahvistuslinkki on lähetetty sähköpostiisi. Vahvista sähköposti ja kirjaudu sitten sisään."
        );
      } else {
        const cred = await loginWithEmail(auth, emailTrimmed, password);
        if (!cred.user.emailVerified) {
          await signOut(auth);
          setError("Sähköpostia ei ole vahvistettu. Tarkista sähköpostisi ja vahvista tili.");
        }
      }
    } catch (e: any) {
      setError(mapAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return {
    mode,
    setMode,
    toggleMode,

    email,
    setEmail,
    password,
    setPassword,

    emailTrimmed,
    emailValid,
    passwordValid,
    canSubmit,

    loading,
    error,
    setError,

    submit,
  };
};