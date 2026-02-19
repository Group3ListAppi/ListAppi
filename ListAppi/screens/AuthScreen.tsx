import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, HelperText, Surface, Text, TextInput, useTheme } from "react-native-paper";
import { auth } from "../firebase/config";
import { useGoogleSignIn } from "../auth/googleSignIn";

import { useAuthForm } from "../auth/hooks/useAuthForm";
import { usePasswordReset } from "../auth/hooks/usePasswordReset";
import { ResetPasswordDialog } from "../components/ResetPasswordDialog";

const AuthScreen: React.FC = () => {
  const theme = useTheme();
  const { signInWithGoogle, disabled: googleDisabled } = useGoogleSignIn();
  const [googleLoading, setGoogleLoading] = useState(false);

  const form = useAuthForm(auth);
  const reset = usePasswordReset(auth);

  const title = form.mode === "login" ? "Kirjaudu sisään" : "Luo käyttäjä";
  const subtitle =
    form.mode === "login" ? "Jatka kirjautumalla tilillesi" : "Luo tili sähköpostilla ja salasanalla";

  const handleGoogle = async () => {
    form.setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      form.setError(e?.message ?? "Google-kirjautuminen epäonnistui.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ResetPasswordDialog
        visible={reset.open}
        onDismiss={reset.closeDialog}
        email={form.email}
        onEmailChange={form.setEmail}
        emailTrimmed={form.emailTrimmed}
        emailValid={form.emailValid}
        message={reset.message}
        onClearMessage={() => reset.setMessage(null)}
        loading={reset.loading}
        cooldown={reset.cooldown}
        onSend={() => reset.send(form.emailTrimmed, form.emailValid)}
      />

      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface, fontWeight: "700" }]}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {subtitle}
        </Text>

        <View style={styles.form}>
          {/* email */}
          <TextInput
            mode="outlined"
            label="Sähköposti"
            value={form.email}
            onChangeText={(t) => {
              form.setEmail(t);
              if (form.error) form.setError(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            left={<TextInput.Icon icon="email-outline" />}
            outlineStyle={styles.inputOutline}
          />
          <HelperText type="error" visible={!form.emailValid}>
            Syötä kelvollinen sähköpostiosoite.
          </HelperText>

          {/* password */}
          <TextInput
            mode="outlined"
            label="Salasana"
            value={form.password}
            onChangeText={(t) => {
              form.setPassword(t);
              if (form.error) form.setError(null);
            }}
            secureTextEntry
            left={<TextInput.Icon icon="lock-outline" />}
            outlineStyle={styles.inputOutline}
          />
          <HelperText type="error" visible={!form.passwordValid}>
            Salasanan tulee olla vähintään 6 merkkiä.
          </HelperText>

          <HelperText type="error" visible={!!form.error}>
            {form.error}
          </HelperText>

          <Button
            mode="contained"
            onPress={form.submit}
            disabled={!form.canSubmit || form.loading || googleLoading}
            loading={form.loading}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
          >
            {form.mode === "login" ? "Kirjaudu" : "Rekisteröidy"}
          </Button>

          {form.mode === "login" ? (
            <Button
              mode="text"
              onPress={reset.open ? reset.closeDialog : reset.openDialog}
              disabled={form.loading || googleLoading}
              style={styles.forgotButton}
            >
              {reset.open ? "Onko sinulla jo tunnukset?" : "Unohtuiko salasana?"}
            </Button>
          ) : null}

          {/* Google Sign-In Hidden */}
          {/* <Button mode="outlined" icon="google" onPress={handleGoogle} disabled={googleDisabled || form.loading || googleLoading} loading={googleLoading}>
            Kirjaudu Googlella
          </Button> */}

          <Button mode="text" onPress={form.toggleMode} disabled={form.loading || googleLoading || reset.open}>
            {form.mode === "login" ? "Ei tiliä? Rekisteröidy" : "Onko sinulla jo tili? Kirjaudu"}
          </Button>
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", padding: 16 },
  card: { borderRadius: 18, padding: 18 },
  title: { marginBottom: 6 },
  subtitle: { marginBottom: 18 },
  form: { gap: 8 },
  inputOutline: { borderRadius: 14 },
  primaryButton: { marginTop: 10, borderRadius: 14 },
  forgotButton: { alignSelf: "center", marginTop: 2 },
  buttonContent: { height: 50 },
});

export default AuthScreen;