import React, { useEffect, useMemo, useState } from "react"
import { StyleSheet } from "react-native"
import {
  Portal,
  Dialog,
  TextInput,
  Button,
  HelperText,
  Text,
  useTheme,
} from "react-native-paper"
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
} from "firebase/auth"
import { auth } from "../firebase/config"
import { updateMyEmail } from "../firebase/userProfileUtils"

type Props = {
  visible: boolean
  onClose: () => void
  onSaved?: (newEmail: string) => void
}

const ChangeEmailDialog: React.FC<Props> = ({ visible, onClose, onSaved }) => {
  const theme = useTheme()

  const [newEmail, setNewEmail] = useState("")
  const [newEmail2, setNewEmail2] = useState("")
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setNewEmail("")
      setNewEmail2("")
      setPassword("")
      setError(null)
      setSaving(false)
    }
  }, [visible])

  const user = auth.currentUser

  const emailTrimmed = newEmail.trim()
  const emailValid = useMemo(() => {
    return emailTrimmed.length === 0 || /\S+@\S+\.\S+/.test(emailTrimmed)
  }, [emailTrimmed])

  const checks = useMemo(() => {
    const sameOk = newEmail2.length === 0 || emailTrimmed === newEmail2.trim()
    const notSameAsCurrent = !user?.email || emailTrimmed.length === 0 || emailTrimmed !== user.email

    return {
      sameOk,
      notSameAsCurrent,
      allValid:
        emailTrimmed.length > 0 &&
        emailValid &&
        emailTrimmed === newEmail2.trim() &&
        password.length > 0 &&
        notSameAsCurrent,
    }
  }, [emailTrimmed, newEmail2, password, emailValid, user?.email])

  const save = async () => {
    setError(null)
    if (!user || !user.email) {
      setError("Et ole kirjautunut sisään.")
      return
    }
    if (!emailTrimmed || !newEmail2 || !password) {
      setError("Täytä kaikki kentät.")
      return
    }
    if (!emailValid) {
      setError("Sähköpostiosoite ei ole kelvollinen.")
      return
    }
    if (emailTrimmed !== newEmail2.trim()) {
      setError("Sähköpostiosoitteet eivät täsmää.")
      return
    }
    if (emailTrimmed === user.email) {
      setError("Uusi sähköposti on sama kuin nykyinen.")
      return
    }

    setSaving(true)
    try {
      const cred = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, cred)

      await verifyBeforeUpdateEmail(user, emailTrimmed)
      await updateMyEmail(emailTrimmed)

      onSaved?.(emailTrimmed)
      onClose()
    } catch (e: any) {
      const code = e?.code as string | undefined

      if (code === "auth/wrong-password") {
        setError("Salasana on väärin.")
      } else if (code === "auth/requires-recent-login") {
        setError("Kirjautuminen on vanhentunut. Kirjaudu uudelleen ja yritä sitten.")
      } else if (code === "auth/email-already-in-use") {
        setError("Sähköposti on jo käytössä.")
      } else if (code === "auth/invalid-email") {
        setError("Sähköpostiosoite ei ole kelvollinen.")
      } else {
        setError(e?.message ?? "Sähköpostin vaihto epäonnistui.")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onClose}
        style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
      >
        <Dialog.Title style={styles.title}>Vaihda sähköposti</Dialog.Title>

        <Dialog.Content>
          <TextInput
            mode="outlined"
            label="Uusi sähköposti"
            value={newEmail}
            onChangeText={(t) => {
              setNewEmail(t)
              if (error) setError(null)
            }}
            outlineStyle={styles.inputOutline}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            mode="outlined"
            label="Uusi sähköposti uudelleen"
            value={newEmail2}
            onChangeText={(t) => {
              setNewEmail2(t)
              if (error) setError(null)
            }}
            outlineStyle={styles.inputOutline}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ marginTop: 10 }}
          />

          <TextInput
            mode="outlined"
            label="Salasana"
            value={password}
            onChangeText={(t) => {
              setPassword(t)
              if (error) setError(null)
            }}
            secureTextEntry
            outlineStyle={styles.inputOutline}
            autoCapitalize="none"
            style={{ marginTop: 10 }}
          />

          <HelperText type="error" visible={!!error || !emailValid || !checks.sameOk || !checks.notSameAsCurrent}>
            {error ??
              (!emailValid
                ? "Sähköpostiosoite ei ole kelvollinen."
                : !checks.sameOk
                  ? "Sähköpostiosoitteet eivät täsmää."
                  : !checks.notSameAsCurrent
                    ? "Uusi sähköposti on sama kuin nykyinen."
                    : "")}
          </HelperText>

          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            Sähköpostin vaihto vaatii salasanan varmistuksen. Saat vahvistusviestin uuteen sähköpostiin.
          </Text>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onClose} disabled={saving}>
            Peruuta
          </Button>
          <Button
            mode="contained"
            onPress={save}
            loading={saving}
            disabled={saving || !checks.allValid}
          >
            Tallenna
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 18,
  },
  title: {
    fontWeight: "700",
  },
  inputOutline: {
    borderRadius: 14,
  },
})

export default ChangeEmailDialog
