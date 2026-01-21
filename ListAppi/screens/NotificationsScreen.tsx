import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import AppBar from "../components/AppBar";

type Props = {
  activeScreen: string;
  onBack: () => void;
  onNavigate: (screen: string) => void;
};

export default function NotificationsScreen({ activeScreen, onBack, onNavigate }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <AppBar
        title="Ilmoitukset"
        onBack={onBack}
        onSettings={() => onNavigate("settings")}
        onNotifications={() => onNavigate("notifications")}
        onTrash={() => onNavigate("trash")}
      />
      <Text variant="headlineMedium" style={styles.content}>Ilmoitukset</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
});
