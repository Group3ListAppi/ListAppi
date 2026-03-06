// src/components/common/ActionModal.tsx
import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { ModalBase } from "../common/ModalBase";

export interface ActionItem {
  id: string;
  label: string;
  onPress: () => void;
  icon?: string;
}

interface ActionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  actions: ActionItem[]; // Annetaan valmiit toiminnot suoraan
}

export const ActionModal: React.FC<ActionModalProps> = ({ visible, onClose, title, actions }) => {
  const theme = useTheme();

  return (
    <ModalBase visible={visible} onClose={onClose} title={title}>
      <ScrollView style={styles.actionsContainer}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => {
              action.onPress();
              onClose();
            }}
            style={[styles.actionButton, { borderBottomColor: theme.colors.outlineVariant }]}
          >
            <View style={styles.actionContent}>
              {action.icon && (
                <MaterialCommunityIcons
                  name={action.icon as any}
                  size={24}
                  color={theme.colors.onSurface}
                  style={styles.actionIcon}
                />
              )}
              <Text style={[styles.actionText, { color: theme.colors.onSurface }]}>
                {action.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ModalBase>
  );
};

const styles = StyleSheet.create({
  actionsContainer: { marginBottom: 16 },
  actionButton: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5 },
  actionContent: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { marginRight: 16 },
  actionText: { fontSize: 16 },
});