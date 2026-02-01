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
  updatePassword,
} from "firebase/auth"
import { auth } from "../firebase/config" 

type Props = {
  visible: boolean
  onClose: () => void
  onSaved?: () => void
}

const MIN_PASSWORD_LEN = 6

const ChangePasswordDialog: React.FC<Props> = ({ visible, onClose, onSaved }) => {
  const theme = useTheme()

  const [oldPw, setOldPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [newPw2, setNewPw2] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setOldPw("")
      setNewPw("")
      setNewPw2("")
      setError(null)
      setSaving(false)
    }
  }, [visible])

  const user = auth.currentUser

  const checks = useMemo(() => {
    const newLenOk = newPw.length === 0 || newPw.length >= MIN_PASSWORD_LEN
    const sameOk = newPw2.length === 0 || newPw === newPw2
    const newDifferentFromOld = newPw.length === 0 || oldPw.length === 0 || newPw !== oldPw

    return {
      newLenOk,
      sameOk,
      newDifferentFromOld,
      allValid:
        oldPw.length > 0 &&
        newPw.length >= MIN_PASSWORD_LEN &&
        newPw === newPw2 &&
        newPw !== oldPw,
    }
  }, [oldPw, newPw, newPw2])

  const save = async () => {
    setError(null)

    if (!user) {
      setError("Et ole kirjautunut sisään.")
      return
    }
    if (!user.email) {
      setError("Sähköpostia ei löytynyt käyttäjältä.")
      return
    }
    if (!oldPw || !newPw || !newPw2) {
      setError("Täytä kaikki kentät.")
      return
    }
    if (newPw.length < MIN_PASSWORD_LEN) {
      setError(`Uuden salasanan tulee olla vähintään ${MIN_PASSWORD_LEN} merkkiä.`)
      return
    }
    if (newPw !== newPw2) {
      setError("Uudet salasanat eivät täsmää.")
      return
    }
    if (newPw === oldPw) {
      setError("Uuden salasanan täytyy olla eri kuin vanha.")
      return
    }

    setSaving(true)
    try {
      // 1) Re-auth vanhalla salasanalla
      const cred = EmailAuthProvider.credential(user.email, oldPw)
      await reauthenticateWithCredential(user, cred)

      // 2) Päivitä salasana
      await updatePassword(user, newPw)

      onSaved?.()
      onClose()
    } catch (e: any) {
      const code = e?.code as string | undefined

      if (code === "auth/wrong-password") {
        setError("Vanha salasana on väärin.")
      } else if (code === "auth/too-many-requests") {
        setError("Liikaa yrityksiä. Yritä myöhemmin uudelleen.")
      } else if (code === "auth/requires-recent-login") {
        setError("Kirjautuminen on vanhentunut. Kirjaudu uudelleen ja yritä sitten.")
      } else if (code === "auth/weak-password") {
        setError("Uusi salasana on liian heikko.")
      } else {
        setError(e?.message ?? "Salasanan vaihto epäonnistui.")
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
        <Dialog.Title style={styles.title}>Vaihda salasana</Dialog.Title>

        <Dialog.Content>
          <TextInput
            mode="outlined"
            label="Vanha salasana"
            value={oldPw}
            onChangeText={(t) => {
              setOldPw(t)
              if (error) setError(null)
            }}
            secureTextEntry
            outlineStyle={styles.inputOutline}
            autoCapitalize="none"
          />

          <TextInput
            mode="outlined"
            label="Uusi salasana"
            value={newPw}
            onChangeText={(t) => {
              setNewPw(t)
              if (error) setError(null)
            }}
            secureTextEntry
            outlineStyle={styles.inputOutline}
            autoCapitalize="none"
            style={{ marginTop: 10 }}
          />

          <TextInput
            mode="outlined"
            label="Uusi salasana uudelleen"
            value={newPw2}
            onChangeText={(t) => {
              setNewPw2(t)
              if (error) setError(null)
            }}
            secureTextEntry
            outlineStyle={styles.inputOutline}
            autoCapitalize="none"
            style={{ marginTop: 10 }}
          />

          <HelperText type="error" visible={!!error || !checks.newLenOk || !checks.sameOk || !checks.newDifferentFromOld}>
            {error ??
              (!checks.newLenOk
                ? `Uuden salasanan tulee olla vähintään ${MIN_PASSWORD_LEN} merkkiä.`
                : !checks.sameOk
                  ? "Uudet salasanat eivät täsmää."
                  : !checks.newDifferentFromOld
                    ? "Uuden salasanan täytyy olla eri kuin vanha."
                    : "")}
          </HelperText>

          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            Salasanan vaihto vaatii vanhan salasanan varmistuksen.
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

export default ChangePasswordDialog