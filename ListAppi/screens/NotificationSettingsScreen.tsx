import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { Button, List, Switch, Text, useTheme } from "react-native-paper";
import ScreenLayout from "../components/ScreenLayout";
import { useAuth } from "../auth/useAuth";
import {
  getNotificationSettings,
  saveNotificationSettings,
  NotificationSettings,
  /* email settings to be re-enabled later */
} from "../firebase/notificationUtils";

interface NotificationSettingsScreenProps {
  activeScreen: string;
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const defaultSettings: NotificationSettings = {
  pushEnabled: true,
  pushInvites: true,
  pushUpdates: true,
  emailEnabled: false,
  emailInvites: false,
  emailUpdates: false,
};

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  activeScreen,
  onBack,
  onNavigate,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      try {
        const data = await getNotificationSettings(user.uid);
        setSettings(data);
      } catch (error) {
        console.log("Error loading notification settings:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.uid]);

  const pushSummary = useMemo(() => {
    const enabledCount = [settings.pushInvites, settings.pushUpdates].filter(Boolean)
      .length;
    if (!settings.pushEnabled) return "Pois päältä";
    return `Päällä: ${enabledCount}/2`;
  }, [settings]);

  /*
  const emailSummary = useMemo(() => {
    if (!settings.emailEnabled) return "Pois päältä";
    return `Päällä: ${settings.emailInvites ? 1 : 0}/1`;
  }, [settings]);
  */

  const handleTogglePushEnabled = async (value: boolean) => {
    const next = {
      ...settings,
      pushEnabled: value,
      pushInvites: value,
      pushUpdates: value,
    };
    setSettings(next);
    try {
      await saveNotificationSettings({
        pushEnabled: value,
        pushInvites: value,
        pushUpdates: value,
      });
    } catch (error) {
      console.log("Error saving push enabled setting:", error);
    }
  };

  /*
  const handleToggleEmailEnabled = async (value: boolean) => {
    const next = {
      ...settings,
      emailEnabled: value,
      emailInvites: value,
      emailUpdates: value,
    };
    setSettings(next);
    try {
      await saveNotificationSettings({
        emailEnabled: value,
        emailInvites: value,
        emailUpdates: value,
      });
    } catch (error) {
      console.log("Error saving email enabled setting:", error);
    }
  };
  */

  return (
    <ScreenLayout
      activeScreen={activeScreen}
      onNavigate={onNavigate}
      showNav={false}
      showBack
      onBack={onBack}
      hideActions={true}
      customTitle="Ilmoitukset"
    >
      <ScrollView style={styles.content}>
        <List.Section>
          <List.Subheader>Push-ilmoitukset</List.Subheader>
          <List.Item
            title="Listojen jakaminen"
            description="Saa ilmoitus kun joku jakaa listan kanssasi tai tekee muutoksia jaettuihin listoihin"
            descriptionNumberOfLines={3}
            left={(props) => (
              <List.Icon {...props} icon={settings.pushEnabled ? "bell" : "bell-off"} />
            )}
            right={() => (
              <Switch
                value={settings.pushEnabled}
                onValueChange={handleTogglePushEnabled}
                disabled={loading}
              />
            )}
          />
          <View style={styles.summaryRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {pushSummary}
            </Text>
            <Button
              mode="text"
              onPress={() => onNavigate("notification-settings-push")}
              disabled={loading || !settings.pushEnabled}
            >
              Muokkaa
            </Button>
          </View>
        </List.Section>

        {/*
        <List.Section>
          <List.Subheader>Sähköposti-ilmoitukset</List.Subheader>
          <List.Item
            title="Listojen jakaminen"
            description="Saa ilmoitus kun joku jakaa listan kanssasi ja opi käyttämään ListAppia paremmin"
            descriptionNumberOfLines={3}
            left={(props) => (
              <List.Icon {...props} icon={settings.emailEnabled ? "email" : "email-off"} />
            )}
            right={() => (
              <Switch
                value={settings.emailEnabled}
                onValueChange={handleToggleEmailEnabled}
                disabled={loading}
              />
            )}
          />
          <View style={styles.summaryRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {emailSummary}
            </Text>
            <Button
              mode="text"
              onPress={() => onNavigate("notification-settings-email")}
              disabled={loading || !settings.emailEnabled}
            >
              Muokkaa
            </Button>
          </View>
        </List.Section>
        */}
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  helper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});

export default NotificationSettingsScreen;
