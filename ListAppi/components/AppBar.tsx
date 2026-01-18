import React from "react";
import { View, StyleSheet } from "react-native";
import { Appbar } from "react-native-paper";

type TopAppBarProps = {
  title: string;
  //takaisin
  onBack?: () => void;
  //kolme pistettä
  onOpenSettings?: () => void;
};

const TopAppBar = ({ title, onBack, onOpenSettings }: TopAppBarProps) => {
  return (
    <Appbar.Header>
      {/* Vasen puoli: back jos on, muuten näkymätön spacer */}
      {onBack ? (
        <Appbar.Action icon="arrow-left" onPress={onBack} />
      ) : (
        <View style={styles.spacer} />
      )}

      <Appbar.Content title={title} style={{ alignItems: "center" }} />

      {/* Oikea puoli: dots jos on, muuten spacer jotta title pysyy keskellä */}
      {onOpenSettings ? (
        <Appbar.Action icon="dots-vertical" onPress={onOpenSettings} />
      ) : (
        <View style={styles.spacer} />
      )}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  spacer: { width: 48 },
});

export default TopAppBar;