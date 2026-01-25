import React, { useState } from "react"
import { View, StyleSheet } from "react-native"
import { Button, Text, TextInput, useTheme, HelperText, Surface } from "react-native-paper"
import { saveMyDisplayName } from "../firebase/userProfileUtils"

type Props = {
  onDone: () => void
}

const ChooseNameScreen: React.FC<Props> = ({ onDone }) => {
  const theme = useTheme()
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSave = async () => {
    setError(null)
    setLoading(true)
    try {
      await saveMyDisplayName(name)
      onDone()
    } catch (e: any) {
      setError(e?.message ?? "Nimen tallennus epäonnistui.")
    } finally {
      setLoading(false)
    }
  }

  const nameTrimmed = name.trim()
  const nameValid = nameTrimmed.length === 0 || nameTrimmed.length >= 2

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Text variant="headlineSmall" style={{ fontWeight: "700", color: theme.colors.onSurface }}>
          Valitse näyttönimi
        </Text>

        <Text style={{ marginTop: 6, marginBottom: 14, color: theme.colors.onSurfaceVariant }}>
          Tätä nimeä näytetään myöhemmin esimerkiksi jaetuissa listoissa.
        </Text>

        <TextInput
          mode="outlined"
          label="Näyttönimi"
          value={name}
          onChangeText={(t) => {
            setName(t)
            if (error) setError(null)
          }}
          autoCapitalize="words"
          outlineStyle={{ borderRadius: 14 }}
        />

        <HelperText type="error" visible={!nameValid}>
          Nimen tulee olla vähintään 2 merkkiä.
        </HelperText>

        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>

        <Button
          mode="contained"
          onPress={onSave}
          loading={loading}
          disabled={!nameTrimmed || !nameValid || loading}
          style={{ marginTop: 10, borderRadius: 14 }}
          contentStyle={{ height: 50 }}
        >
          Tallenna
        </Button>
      </Surface>
    </View>
  )
}

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
})

export default ChooseNameScreen