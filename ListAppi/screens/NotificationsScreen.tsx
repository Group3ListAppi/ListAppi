import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import AppBar from "../components/AppBar";
import ScreenLayout from "../components/ScreenLayout";

type Props = {
  activeScreen: string;
  onBack: () => void;
  onNavigate: (screen: string) => void;
};

export default function NotificationsScreen({ activeScreen, onBack, onNavigate }: Props) {
  const theme = useTheme();
  return (
    <ScreenLayout 
      activeScreen={activeScreen} 
      onNavigate={onNavigate} 
      showNav={false}
      showBack={true}
      onBack={onBack}
      customTitle="Ilmoitukset"
    >
      <Text variant="headlineMedium" style={styles.content}>Ilmoitukset</Text>
    </ScreenLayout>
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
