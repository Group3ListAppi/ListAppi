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
import { saveMyDisplayName } from "../firebase/userProfileUtils"

type Props = {
  visible: boolean
  initialName?: string
  onClose: () => void
  onSaved: (newName: string) => void
}

const EditDisplayNameDialog: React.FC<Props> = ({
  visible,
  initialName = "",
  onClose,
  onSaved,
}) => {
  const theme = useTheme()

  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Kun dialogi avataan uudelleen, resetoi state
  useEffect(() => {
    if (visible) {
      setName(initialName)
      setError(null)
      setSaving(false)
    }
  }, [visible, initialName])

  const trimmed = name.trim()
  const valid = useMemo(
    () => trimmed.length === 0 || trimmed.length >= 2,
    [trimmed]
  )

  const save = async () => {
    setError(null)

    if (!trimmed) {
      setError("Syötä nimi.")
      return
    }
    if (!valid) {
      setError("Nimen tulee olla vähintään 2 merkkiä.")
      return
    }

    setSaving(true)
    try {
      await saveMyDisplayName(trimmed)
      onSaved(trimmed)
      onClose()
    } catch (e: any) {
      setError(e?.message ?? "Nimen tallennus epäonnistui.")
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
        <Dialog.Title style={styles.title}>Muuta näyttönimeä</Dialog.Title>

        <Dialog.Content>
          <TextInput
            mode="outlined"
            label="Näyttönimi"
            value={name}
            onChangeText={(t) => {
              setName(t)
              if (error) setError(null)
            }}
            outlineStyle={styles.inputOutline}
            autoCapitalize="words"
          />

          <HelperText type="error" visible={!!error || !valid}>
            {error ?? (!valid ? "Nimen tulee olla vähintään 2 merkkiä." : "")}
          </HelperText>

          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
          >
            Tätä nimeä näytetään muille käyttäjille jaetuissa listoissa.
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
            disabled={saving}
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

export default EditDisplayNameDialog