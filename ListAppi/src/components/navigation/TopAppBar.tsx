// src/components/navigation/TopAppBar.tsx
import React from "react";
import { Appbar, Badge } from "react-native-paper";
import { StyleSheet, View } from "react-native";

interface TopAppBarProps {
  title: string;
  onBack?: () => void;
  onNotifications?: () => void;
  onMenuPress?: () => void;
  notificationCount?: number;
}

export const TopAppBar = ({ 
  title, 
  onBack, 
  onNotifications, 
  onMenuPress, 
  notificationCount = 0 
}: TopAppBarProps) => {
  return (
    <Appbar.Header mode="center-aligned">
      {onBack ? (
        <Appbar.Action icon="arrow-left" onPress={onBack} />
      ) : (
        <View style={styles.spacer} />
      )}

      <Appbar.Content title={title} />

      <View>
        <Appbar.Action icon="bell" onPress={onNotifications} />
        {notificationCount > 0 && (
          <Badge style={styles.badge} size={16}>{notificationCount}</Badge>
        )}
      </View>
      
      <Appbar.Action icon="dots-vertical" onPress={onMenuPress} />
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  spacer: { width: 48 },
  badge: { position: 'absolute', top: 4, right: 4 }
});