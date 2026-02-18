import React, { useMemo, useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Divider,
  HelperText,
  Surface,
  Text,
  TextInput,
  useTheme,
  Portal,
  Dialog,
} from "react-native-paper";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  reload,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { useGoogleSignIn } from "../auth/googleSignIn";

type Mode = "login" | "register";

const AuthScreen: React.FC = () => {
  const theme = useTheme();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // tätä käytetään login/register virheisiin
  const [error, setError] = useState<string | null>(null);

  // salasanan palautus-dialogin state
  const [resetOpen, setResetOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetCooldown, setResetCooldown] = useState(0);

  const { signInWithGoogle, disabled: googleDisabled } = useGoogleSignIn();

  const emailTrimmed = email.trim();

  const emailValid = useMemo(() => {
    return emailTrimmed.length === 0 || /\S+@\S+\.\S+/.test(emailTrimmed);
  }, [emailTrimmed]);

  const passwordValid = useMemo(() => {
    return password.length === 0 || password.length >= 6;
  }, [password]);

  useEffect(() => {
    if (resetCooldown <= 0) return;

    const timer = setInterval(() => {
      setResetCooldown((s) => s - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resetCooldown]);

  const canSubmit =
    emailTrimmed.length > 0 &&
    password.length > 0 &&
    emailValid &&
    passwordValid;

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(auth, emailTrimmed, password);
        await sendEmailVerification(cred.user);
        await signOut(auth);
        setMode("login");
        setError("Vahvistuslinkki on lähetetty sähköpostiisi. Vahvista sähköposti ja kirjaudu sitten sisään.");
      } else {
        const cred = await signInWithEmailAndPassword(auth, emailTrimmed, password);
        await reload(cred.user);
        if (!cred.user.emailVerified) {
          await signOut(auth);
          setError("Sähköpostia ei ole vahvistettu. Tarkista sähköpostisi ja vahvista tili.");
        }
      }
    } catch (e: any) {
      const msg =
        e?.code === "auth/email-already-in-use"
          ? "Sähköposti on jo käytössä."
          : e?.code === "auth/wrong-password" ||
            e?.code === "auth/invalid-credential"
          ? "Väärä sähköposti tai salasana."
          : e?.code === "auth/user-not-found"
          ? "Käyttäjää ei löydy."
          : e?.code === "auth/weak-password"
          ? "Salasana on liian lyhyt (min 6 merkkiä)."
          : e?.code === "auth/invalid-email"
          ? "Sähköpostiosoite ei ole kelvollinen."
          : e?.message ?? "Kirjautuminen epäonnistui.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // avaa dialogi
  const openReset = () => {
    setResetMessage(null);
    setResetOpen(true);
  };

  // sulje dialogi
  const closeReset = () => {
    setResetLoading(false);
    setResetMessage(null);
    setResetOpen(false);
  };

  // lähetä palautuslinkki dialogista
  const sendResetLink = async () => {
    setResetMessage(null);

    if (!emailTrimmed) {
      setResetMessage("Syötä sähköposti, niin lähetän palautuslinkin.");
      return;
    }
    if (!emailValid) {
      setResetMessage("Syötä kelvollinen sähköpostiosoite.");
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailTrimmed);
      setResetMessage("Jos sähköposti on rekisteröity, saat pian palautuslinkin.");
      // 60 sekunnin cooldown
      setResetCooldown(60);
    } catch (e: any) {
      const msg =
        e?.code === "auth/user-not-found"
          ? "Tällä sähköpostilla ei löytynyt käyttäjää."
          : e?.code === "auth/invalid-email"
          ? "Sähköpostiosoite ei ole kelvollinen."
          : e?.message ?? "Palautuslinkin lähetys epäonnistui.";
      setResetMessage(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message ?? "Google-kirjautuminen epäonnistui.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const toggleMode = () => {
    setError(null);
    setMode((m) => (m === "login" ? "register" : "login"));
  };

  const title = mode === "login" ? "Kirjaudu sisään" : "Luo käyttäjä";
  const subtitle =
    mode === "login"
      ? "Jatka kirjautumalla tilillesi"
      : "Luo tili sähköpostilla ja salasanalla";

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* SALASANAN PALAUTUS DIALOG */}
      <Portal>
        <Dialog
            visible={resetOpen}
            onDismiss={closeReset}
            style={[
                styles.dialog,
                {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
                },
            ]}
            >
        <Dialog.Title style={[styles.dialogTitle, { color: theme.colors.onSurface }]}>
            Palauta salasana
        </Dialog.Title>

        <Dialog.Content style={styles.dialogContent}>
            <Text
            variant="bodyMedium"
            style={[styles.dialogSubtitle, { color: theme.colors.onSurfaceVariant }]}
            >
            Syötä sähköpostiosoitteesi, niin lähetän sinulle palautuslinkin.
            </Text>

            {/* käytetään samaa email-inputtia */}
            <TextInput
              mode="outlined"
              label="Sähköposti"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (resetMessage) setResetMessage(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              outlineStyle={styles.inputOutline}
            />

            {/* Email-validointi */}
            <HelperText type="error" visible={!!emailTrimmed && !emailValid}>
              Syötä kelvollinen sähköpostiosoite.
            </HelperText>

            {/* Reset-viesti (näytetään aina kun se on asetettu) */}
            {resetMessage ? (
              <HelperText type="info" visible={true}>
                {resetMessage}
              </HelperText>
            ) : null}
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={closeReset} disabled={resetLoading}>
              Peruuta
            </Button>
            <Button
              mode="contained"
              onPress={sendResetLink}
              loading={resetLoading}
              disabled={resetLoading || resetCooldown > 0}
            >
              {resetCooldown > 0
                ? `Yritä uudelleen ${resetCooldown}s`
                : "Lähetä linkki"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Surface
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={2}
      >
        <Text
          variant="headlineSmall"
          style={[
            styles.title,
            { color: theme.colors.onSurface, fontWeight: "700" },
          ]}
        >
          {title}
        </Text>

        <Text
          variant="bodyMedium"
          style={[
            styles.subtitle,
            { color: theme.colors.onSurfaceVariant, opacity: 0.9 },
          ]}
        >
          {subtitle}
        </Text>

        <View style={styles.form}>
          <TextInput
            mode="outlined"
            label="Sähköposti"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (error) setError(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            left={<TextInput.Icon icon="email-outline" />}
            outlineStyle={styles.inputOutline}
          />
          <HelperText type="error" visible={!emailValid}>
            Syötä kelvollinen sähköpostiosoite.
          </HelperText>

          <TextInput
            mode="outlined"
            label="Salasana"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) setError(null);
            }}
            secureTextEntry
            left={<TextInput.Icon icon="lock-outline" />}
            outlineStyle={styles.inputOutline}
          />
          <HelperText type="error" visible={!passwordValid}>
            Salasanan tulee olla vähintään 6 merkkiä.
          </HelperText>

          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
          <Button
            mode="contained"
            onPress={submit}
            disabled={!canSubmit || loading || googleLoading}
            loading={loading}
            style={[
              styles.primaryButton,
              {
                borderColor: theme.colors.outline,
                backgroundColor: "rgba(50, 184, 68, 0.9)",
              },
            ]}
            contentStyle={styles.buttonContent}
          >
            {mode === "login" ? "Kirjaudu" : "Rekisteröidy"}
          </Button>

          {/* TÄMÄ VAIHTUU SALASANANPALAUTUS-TILASSA */}
          {mode === "login" ? (
            <Button
              mode="text"
              onPress={resetOpen ? closeReset : openReset}
              disabled={loading || googleLoading}
              style={styles.forgotButton}
            >
              {resetOpen ? "Onko sinulla jo tunnukset?" : "Unohtuiko salasana?"}
            </Button>
          ) : null}

          {/* Google Sign-In Hidden */}
          {/* <Divider style={styles.divider} />

          <Button
            mode="outlined"
            icon="google"
            onPress={handleGoogle}
            disabled={googleDisabled || loading || googleLoading}
            loading={googleLoading}
            style={styles.googleButton}
            contentStyle={styles.buttonContent}
          >
            Kirjaudu Googlella
          </Button> */}

          <Button
            mode="text"
            onPress={toggleMode}
            disabled={loading || googleLoading || resetOpen}
            style={styles.linkButton}
          >
            {mode === "login"
              ? "Ei tiliä? Rekisteröidy"
              : "Onko sinulla jo tili? Kirjaudu"}
          </Button>
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    borderRadius: 18,
    padding: 18,
  },
  title: {
    marginBottom: 6,
  },
  subtitle: {
    marginBottom: 18,
  },
  form: {
    gap: 8,
  },
  inputOutline: {
    borderRadius: 14,
  },
  errorBox: {
    padding: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  resetBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  primaryButton: {
    marginTop: 10,
    borderRadius: 14,
  },
  forgotButton: {
    alignSelf: "center",
    marginTop: 2,
  },
  googleButton: {
    borderRadius: 14,
  },
  buttonContent: {
    height: 50,
  },
  divider: {
    marginTop: 16,
    marginBottom: 12,
  },
  linkButton: {
    alignSelf: "center",
  },
  dialog: {
  borderRadius: 18,
  borderWidth: 1,
  paddingTop: 6, 
  },
  dialogTitle: {
    fontWeight: "700",
    fontSize: 20,
  },
  dialogContent: {
    paddingTop: 4,
  },
  dialogSubtitle: {
    marginBottom: 12,
    opacity: 0.9,
  },
  dialogActions: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  dialogPrimaryButton: {
    borderRadius: 14,
  }
});

export default AuthScreen;