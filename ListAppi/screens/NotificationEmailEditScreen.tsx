import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { Checkbox, List, Switch, useTheme } from "react-native-paper";
import ScreenLayout from "../components/ScreenLayout";
import { useAuth } from "../auth/useAuth";
import {
  getNotificationSettings,
  saveNotificationSettings,
  NotificationSettings,
} from "../firebase/notificationUtils";

interface NotificationEmailEditScreenProps {
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

const NotificationEmailEditScreen: React.FC<NotificationEmailEditScreenProps> = ({
  activeScreen,
  onBack,
  onNavigate,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const initialRef = useRef<NotificationSettings | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      try {
        const data = await getNotificationSettings(user.uid);
        setSettings(data);
        initialRef.current = data;
      } catch (error) {
        console.log("Error loading notification settings:", error);
      } finally {
        setLoaded(true);
      }
    };

    load();
  }, [user?.uid]);

  const handleToggleEmailInvites = () => {
    setSettings((prev) => {
      const nextInvites = !prev.emailInvites;
      const nextEnabled = nextInvites;
      const next = {
        ...prev,
        emailInvites: nextInvites,
        emailEnabled: nextEnabled,
      };
      persistSettings(next).catch(() => null);
      return next;
    });
  };

  const persistIfChanged = async () => {
    if (!user?.uid || !loaded) return;
    const initial = initialRef.current ?? defaultSettings;
    const changed =
      initial.emailInvites !== settings.emailInvites ||
      initial.emailEnabled !== settings.emailEnabled;

    if (!changed) return;

    try {
      await persistSettings(settings);
    } catch (error) {
      console.log("Error saving notification settings:", error);
    }
  };

  const persistSettings = async (next: NotificationSettings) => {
    if (!user?.uid || !loaded) return;
    try {
      await saveNotificationSettings({
        emailInvites: next.emailInvites,
        emailEnabled: next.emailEnabled,
        emailUpdates: next.emailUpdates,
      });
      initialRef.current = { ...next };
    } catch (error) {
      console.log("Error saving notification settings:", error);
    }
  };

  const handleToggleMaster = (value: boolean) => {
    setSettings((prev) => {
      let nextInvites = prev.emailInvites;
      if (!value) {
        nextInvites = false;
      }
      if (value && !nextInvites) {
        nextInvites = true;
      }
      const next = {
        ...prev,
        emailEnabled: value,
        emailInvites: nextInvites,
      };
      persistSettings(next).catch(() => null);
      return next;
    });
  };

  const handleBack = async () => {
    await persistIfChanged();
    onBack();
  };

  useEffect(() => {
    return () => {
      persistIfChanged().catch(() => null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, loaded, user?.uid]);

  return (
    <ScreenLayout
      activeScreen={activeScreen}
      onNavigate={onNavigate}
      showNav={false}
      showBack
      onBack={handleBack}
      hideActions
      rightElement={
        <View style={styles.switchWrapper}>
          <Switch value={settings.emailEnabled} onValueChange={handleToggleMaster} />
        </View>
      }
      customTitle="Muokkaa sähköposti-ilmoituksia"
    >
      <ScrollView style={styles.content}>
        <List.Section>
          <List.Subheader>Valitse ilmoitukset</List.Subheader>
          <Checkbox.Item
            label="Listojen jakaminen"
            status={settings.emailInvites ? "checked" : "unchecked"}
            onPress={handleToggleEmailInvites}
            disabled={!settings.emailEnabled}
          />
        </List.Section>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  switchWrapper: {
    paddingRight: 8,
  },
});

export default NotificationEmailEditScreen;
