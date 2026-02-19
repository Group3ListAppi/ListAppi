import React from "react";
import { StyleSheet } from "react-native";
import { Button, Dialog, HelperText, Portal, Text, TextInput, useTheme } from "react-native-paper";

type Props = {
  visible: boolean;
  onDismiss: () => void;

  email: string;
  onEmailChange: (t: string) => void;

  emailTrimmed: string;
  emailValid: boolean;

  message: string | null;
  onClearMessage: () => void;

  loading: boolean;
  cooldown: number;
  onSend: () => void;
};

export const ResetPasswordDialog: React.FC<Props> = ({
  visible,
  onDismiss,
  email,
  onEmailChange,
  emailTrimmed,
  emailValid,
  message,
  onClearMessage,
  loading,
  cooldown,
  onSend,
}) => {
  const theme = useTheme();

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={[
          styles.dialog,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
        ]}
      >
        <Dialog.Title style={[styles.dialogTitle, { color: theme.colors.onSurface }]}>
          Palauta salasana
        </Dialog.Title>

        <Dialog.Content style={styles.dialogContent}>
          <Text variant="bodyMedium" style={[styles.dialogSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Syötä sähköpostiosoitteesi, niin lähetän sinulle palautuslinkin.
          </Text>

          <TextInput
            mode="outlined"
            label="Sähköposti"
            value={email}
            onChangeText={(t) => {
              onEmailChange(t);
              if (message) onClearMessage();
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            outlineStyle={styles.inputOutline}
          />

          <HelperText type="error" visible={!!emailTrimmed && !emailValid}>
            Syötä kelvollinen sähköpostiosoite.
          </HelperText>

          {message ? (
            <HelperText type="info" visible={true}>
              {message}
            </HelperText>
          ) : null}
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={loading}>
            Peruuta
          </Button>
          <Button mode="contained" onPress={onSend} loading={loading} disabled={loading || cooldown > 0}>
            {cooldown > 0 ? `Yritä uudelleen ${cooldown}s` : "Lähetä linkki"}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: { borderRadius: 18, borderWidth: 1, paddingTop: 6 },
  dialogTitle: { fontWeight: "700", fontSize: 20 },
  dialogContent: { paddingTop: 4 },
  dialogSubtitle: { marginBottom: 12, opacity: 0.9 },
  inputOutline: { borderRadius: 14 },
});