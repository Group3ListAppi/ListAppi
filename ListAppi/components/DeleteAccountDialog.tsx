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
  deleteUser,
} from "firebase/auth"
import { auth } from "../firebase/config"
import { deleteUserProfileAndOwnedData } from "../firebase/userDeleteUtils"

type Props = {
  visible: boolean
  onClose: () => void
}

const DeleteAccountDialog: React.FC<Props> = ({ visible, onClose }) => {
  const theme = useTheme()
  const [password, setPassword] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setPassword("")
      setConfirmText("")
      setError(null)
      setLoading(false)
    }
  }, [visible])

  const user = auth.currentUser

  const canDelete = useMemo(() => {
    return password.length > 0 && confirmText.trim().toUpperCase() === "POISTA"
  }, [password, confirmText])

  const runDelete = async () => {
    setError(null)
    if (!user || !user.email) {
      setError("Et ole kirjautunut sisään.")
      return
    }
    if (!canDelete) {
      setError('Kirjoita vahvistukseksi "POISTA" ja syötä salasana.')
      return
    }

    setLoading(true)
    try {
      // 1) reauth
      const cred = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, cred)

      // 2) poista app-data Firestoresta
      await deleteUserProfileAndOwnedData(user.uid)

      // 3) poista auth-tili -> tämä laukaisee onAuthStateChanged(user=null)
      await deleteUser(user)

      onClose()
    } catch (e: any) {
      const code = e?.code as string | undefined
      if (code === "auth/wrong-password") setError("Salasana on väärin.")
      else if (code === "auth/requires-recent-login")
        setError("Kirjautuminen on vanhentunut. Kirjaudu uudelleen ja yritä sitten.")
      else setError(e?.message ?? "Tilin poisto epäonnistui.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onClose}
        style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
      >
        <Dialog.Title style={[styles.title, { color: theme.colors.error }]}>
          Poista tili
        </Dialog.Title>

        <Dialog.Content>
          <Text style={{ marginBottom: 10 }}>
            Tämä poistaa tilisi ja siihen liittyvät tiedot pysyvästi. Tätä ei voi perua.
          </Text>

          <TextInput
            mode="outlined"
            label='Kirjoita "POISTA" vahvistukseksi'
            value={confirmText}
            onChangeText={(t) => {
              setConfirmText(t)
              if (error) setError(null)
            }}
            outlineStyle={styles.inputOutline}
            autoCapitalize="characters"
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

          <HelperText type="error" visible={!!error}>
            {error ?? ""}
          </HelperText>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onClose} disabled={loading}>
            Peruuta
          </Button>
          <Button
            mode="contained"
            onPress={runDelete}
            loading={loading}
            disabled={loading || !canDelete}
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
          >
            Poista tili
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}

const styles = StyleSheet.create({
  dialog: { borderRadius: 18 },
  title: { fontWeight: "700" },
  inputOutline: { borderRadius: 14 },
})

export default DeleteAccountDialog