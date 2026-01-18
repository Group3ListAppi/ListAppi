import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import TopAppBar from "../components/AppBar";

type Props = {
  onBack: () => void;
};

export default function SettingsScreen({ onBack }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TopAppBar title="Asetukset" onBack={onBack} />

      <View style={styles.content}>
        <Text variant="headlineMedium">Asetukset</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});