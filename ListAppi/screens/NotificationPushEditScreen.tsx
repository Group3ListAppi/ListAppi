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

interface NotificationPushEditScreenProps {
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

const NotificationPushEditScreen: React.FC<NotificationPushEditScreenProps> = ({
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

  const persistSettings = async (next: NotificationSettings) => {
    if (!user?.uid || !loaded) return;
    try {
      await saveNotificationSettings({
        pushInvites: next.pushInvites,
        pushUpdates: next.pushUpdates,
        pushEnabled: next.pushEnabled,
      });
      initialRef.current = { ...next };
    } catch (error) {
      console.log("Error saving notification settings:", error);
    }
  };

  const handleToggleMaster = (value: boolean) => {
    setSettings((prev) => {
      let nextInvites = prev.pushInvites;
      let nextUpdates = prev.pushUpdates;
      if (!value) {
        nextInvites = false;
        nextUpdates = false;
      }
      if (value && !nextInvites && !nextUpdates) {
        nextInvites = true;
        nextUpdates = true;
      }
      const next = {
        ...prev,
        pushEnabled: value,
        pushInvites: nextInvites,
        pushUpdates: nextUpdates,
      };
      persistSettings(next).catch(() => null);
      return next;
    });
  };

  const handleToggleInvites = () => {
    setSettings((prev) => {
      const nextInvites = !prev.pushInvites;
      const nextUpdates = prev.pushUpdates;
      const nextEnabled = nextInvites || nextUpdates;
      const next = {
        ...prev,
        pushInvites: nextInvites,
        pushEnabled: nextEnabled,
      };
      persistSettings(next).catch(() => null);
      return next;
    });
  };

  const handleToggleUpdates = () => {
    setSettings((prev) => {
      const nextUpdates = !prev.pushUpdates;
      const nextInvites = prev.pushInvites;
      const nextEnabled = nextInvites || nextUpdates;
      const next = {
        ...prev,
        pushUpdates: nextUpdates,
        pushEnabled: nextEnabled,
      };
      persistSettings(next).catch(() => null);
      return next;
    });
  };

  const persistIfChanged = async () => {
    if (!user?.uid || !loaded) return;
    const initial = initialRef.current ?? defaultSettings;
    const changed =
      initial.pushInvites !== settings.pushInvites ||
      initial.pushUpdates !== settings.pushUpdates ||
      initial.pushEnabled !== settings.pushEnabled;

    if (!changed) return;

    await persistSettings(settings);
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
      hideActions={true}
      rightElement={
        <View style={styles.switchWrapper}>
          <Switch value={settings.pushEnabled} onValueChange={handleToggleMaster} />
        </View>
      }
      customTitle="Push-ilmoitukset"
    >
      <ScrollView style={styles.content}>
        <List.Section>
          <List.Subheader>Valitse ilmoitukset</List.Subheader>
          <Checkbox.Item
            label="Kutsut"
            status={settings.pushInvites ? "checked" : "unchecked"}
            onPress={handleToggleInvites}
            disabled={!settings.pushEnabled}
          />
          <Checkbox.Item
            label="Ostoslistojen, ruokalistojen ja kokoelmien päivitykset"
            status={settings.pushUpdates ? "checked" : "unchecked"}
            onPress={handleToggleUpdates}
            disabled={!settings.pushEnabled}
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

export default NotificationPushEditScreen;
