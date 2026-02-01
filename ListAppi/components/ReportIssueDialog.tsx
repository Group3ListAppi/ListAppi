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
  Checkbox,
} from "react-native-paper"
import * as Linking from "expo-linking"
import * as Device from "expo-device"
import * as Application from "expo-application"
import * as Clipboard from "expo-clipboard"
import { useAuth } from "../auth/useAuth"

type Props = {
  visible: boolean
  onClose: () => void
  supportEmail: string
  mode?: "issue" | "feedback"
}

const encode = (s: string) => encodeURIComponent(s)

const ReportIssueDialog: React.FC<Props> = ({
    visible,
    onClose,
    supportEmail,
    mode = "issue",
    }) => {

  const theme = useTheme()
  const { user } = useAuth()

  const isIssue = mode === "issue"

  const dialogTitle = isIssue ? "Ilmoita ongelmasta" : "Yleinen palaute"
  const subjectPrefix = isIssue ? "ListApp – Ongelmaraportti" : "ListApp – Palaute"
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [includeTech, setIncludeTech] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [opening, setOpening] = useState(false)
  const [fallbackText, setFallbackText] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

  useEffect(() => {
  if (visible) {
    setTitle("")
    setDesc("")
    setIncludeTech(mode === "issue") // issue: true, feedback: false
    setError(null)
    setOpening(false)
    setFallbackText(null)
    setCopied(false)
  }
}, [visible, mode])

  const valid = useMemo(() => desc.trim().length >= 10, [desc])

  const buildTechBlock = () => {
    const appName = Application.applicationName ?? "ListApp"
    const version = Application.nativeApplicationVersion ?? "?"
    const build = Application.nativeBuildVersion ?? "?"
    const os = `${Device.osName ?? "?"} ${Device.osVersion ?? "?"}`
    const model = Device.modelName ?? "?"
    const uid = user?.uid ?? "-"
    const email = user?.email ?? "-"

    return [
      "",
      "----",
      "Tekniset tiedot",
      `App: ${appName} ${version} (${build})`,
      `Laite: ${model}`,
      `OS: ${os}`,
      `Käyttäjä: ${email}`,
      `uid: ${uid}`,
      `Aika: ${new Date().toISOString()}`,
      "----",
    ].join("\n")
  }

  const openEmail = async () => {
    setError(null)

    const description = desc.trim()
    const subjectTitle = title.trim()

    if (!description) {
      setError("Kuvaa ongelma.")
      return
    }
    if (!valid) {
      setError("Kuvauksen tulee olla vähintään 10 merkkiä.")
      return
    }

    const subject = `${subjectPrefix}${subjectTitle ? `: ${subjectTitle}` : ""}`

    const bodyParts = isIssue
    ? [
        "Hei! Löysin sovelluksesta ongelman:",
        "",
        "Kuvaus:",
        description,
        "",
        "Toistotapa (jos tiedossa):",
        "1) ...",
        "2) ...",
        "3) ...",
        ]
    : [
        "Hei! Tässä palautetta ListAppista:",
        "",
        "Palaute:",
        description,
        "",
        "Toive / idea (valinnainen):",
        "- ...",
        ]

    if (includeTech) bodyParts.push(buildTechBlock())

    const body = bodyParts.join("\n")

    const mailtoUrl = `mailto:${supportEmail}?subject=${encode(subject)}&body=${encode(body)}`

    setOpening(true)
    try {
    const can = await Linking.canOpenURL(mailtoUrl)

    if (!can) {
        //  Fallback: ei mail-appia
        setFallbackText(
        `Vastaanottaja: ${supportEmail}\n` +
        `Aihe: ${subject}\n\n${body}`
        )
        return
    }

    await Linking.openURL(mailtoUrl)
    onClose()
    } catch (e: any) {
    setError(e?.message ?? "Sähköpostin avaaminen epäonnistui.")
    } finally {
    setOpening(false)
    }
  }

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onClose}
        style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
      >
        <Dialog.Title style={styles.title}>{dialogTitle}</Dialog.Title>

        <Dialog.Content>
          <TextInput
            mode="outlined"
            label="Otsikko (valinnainen)"
            value={title}
            onChangeText={(t) => {
              setTitle(t)
              if (error) setError(null)
            }}
            outlineStyle={styles.inputOutline}
          />

          <TextInput
            mode="outlined"
            label="Kuvaus *"
            value={desc}
            onChangeText={(t) => {
              setDesc(t)
              if (error) setError(null)
            }}
            outlineStyle={styles.inputOutline}
            multiline
            numberOfLines={5}
            style={{ marginTop: 10 }}
          />

          <HelperText type="error" visible={!!error || (!valid && desc.length > 0)}>
            {error ?? (!valid ? "Kuvauksen tulee olla vähintään 10 merkkiä." : "")}
          </HelperText>

          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            {isIssue
                ? "Vinkki: kerro mitä teit juuri ennen kuin ongelma tapahtui."
                : "Vinkki: kerro mikä toimi hyvin ja mitä toivoisit lisää."}
          </Text>

          <Text style={{ marginTop: 12, marginBottom: 6 }} variant="titleSmall">
            Liitteet
          </Text>

          <Checkbox.Item
            label="Liitä tekniset tiedot"
            status={includeTech ? "checked" : "unchecked"}
            onPress={() => setIncludeTech((v) => !v)}
            position="leading"
            style={{ paddingHorizontal: 0 }}
          />
          {fallbackText && (
            <>
                <Text style={{ marginTop: 12 }} variant="titleSmall">
                Sähköpostisovellusta ei löytynyt
                </Text>

                <Text variant="bodySmall" style={{ marginBottom: 6 }}>
                Kopioi alla oleva raportti ja lähetä se osoitteeseen {supportEmail}.
                </Text>

                <TextInput
                mode="outlined"
                value={fallbackText}
                multiline
                editable={false}
                style={{ minHeight: 120 }}
                />

                <Button
                style={{ marginTop: 8 }}
                onPress={async () => {
                    await Clipboard.setStringAsync(fallbackText)
                    setCopied(true)
                }}
                >
                {copied ? "Kopioitu!" : "Kopioi raportti"}
                </Button>
            </>
            )}
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onClose} disabled={opening}>
            Peruuta
          </Button>
          <Button mode="contained" onPress={openEmail} loading={opening} disabled={opening || !valid}>
            Avaa sähköposti
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

export default ReportIssueDialog