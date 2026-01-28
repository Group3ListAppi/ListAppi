import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ToolBarProps {
  selectedCount: number;
  onMove?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  selectedCount,
  onMove,
  onShare,
  onDelete,
  onCancel,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.primary,
      borderWidth: 1,
    }]}>
      <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
        <MaterialCommunityIcons
          name="close"
          size={24}
          color={theme.colors.onSurface}
        />
      </TouchableOpacity>
      
      <Text style={[styles.countText, { color: theme.colors.onSurface }]}>
        {selectedCount} valittu
      </Text>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          onPress={onMove}
          style={styles.actionButton}
          disabled={selectedCount === 0 || !onMove}
        >
          <MaterialCommunityIcons
            name="folder-move"
            size={24}
            color={selectedCount === 0 || !onMove ? theme.colors.outline : theme.colors.onSurface}
          />
          <Text
            style={[
              styles.actionText,
              { color: selectedCount === 0 || !onMove ? theme.colors.outline : theme.colors.onSurface }
            ]}
          >
            Siirrä
          </Text>
        </TouchableOpacity>

        {onShare && (
          <TouchableOpacity
            onPress={onShare}
            style={styles.actionButton}
            disabled={selectedCount === 0}
          >
            <MaterialCommunityIcons
              name="share-variant"
              size={24}
              color={selectedCount === 0 ? theme.colors.outline : theme.colors.onSurface}
            />
            <Text
              style={[
                styles.actionText,
                { color: selectedCount === 0 ? theme.colors.outline : theme.colors.onSurface }
              ]}
            >
              Jaa
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onDelete}
          style={styles.actionButton}
          disabled={selectedCount === 0 || !onDelete}
        >
          <MaterialCommunityIcons
            name="delete"
            size={24}
            color={selectedCount === 0 || !onDelete ? theme.colors.outline : theme.colors.onSurface}
          />
          <Text
            style={[
              styles.actionText,
              { color: selectedCount === 0 || !onDelete ? theme.colors.outline : theme.colors.onSurface }
            ]}
          >
            Poista
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    gap: 12,
  },
  cancelButton: {
    padding: 4,
  },
  countText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
