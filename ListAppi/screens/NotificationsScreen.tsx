import React from "react";
import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import ScreenLayout from "../components/ScreenLayout";

type Props = {
  activeScreen: string;
  onBack: () => void;
  onNavigate: (screen: string) => void;
};

export default function NotificationsScreen({ activeScreen, onBack, onNavigate }: Props) {
  return (
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate}>
      <Text variant="headlineMedium">Ilmoitukset</Text>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({});
