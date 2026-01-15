import React from "react";
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface ActionButton {
  id: string
  label: string
  onPress: () => void
  icon?: string
}

interface ActionModalProps {
  visible: boolean
  onClose: () => void
  title: string
  actionIds: string[]
  onShare?: () => void
  onEdit?: () => void
  onRename?: () => void
  onRemove?: () => void
  onLogout?: () => void
  onSettings?: () => void
  shareLabel?: string
}

// Määeritellään toiminnot ja niiden ominaisuudet
const ACTION_DEFINITIONS: Record<string, Omit<ActionButton, 'onPress'> & { onPressKey: keyof ActionModalProps }> = {
    logout: {
        id: 'logout',
        label: 'Kirjaudu ulos',
        icon: 'logout',
        onPressKey: 'onLogout',
    },
    settings: {
        id: 'settings',
        label: 'Asetukset',
        icon: 'cog',
        onPressKey: 'onSettings',
    },
    share: {
        id: 'share',
        label: 'Jaa lista',
        icon: 'share-variant',
        onPressKey: 'onShare',
    },
    edit: {
        id: 'edit',
        label: 'Muokkaa',
        icon: 'pencil',
        onPressKey: 'onEdit',
    },
    rename: {
        id: 'rename',
        label: 'Nimeä uudelleen',
        icon: 'pencil-box-outline',
        onPressKey: 'onRename',
    },
    remove: {
        id: 'remove',
        label: 'Poista lista',
        icon: 'trash-can-outline',
        onPressKey: 'onRemove',
    },
}

export const ActionModal: React.FC<ActionModalProps> = ({
  visible,
  onClose,
  title,
  actionIds,
  onShare,
  onEdit,
  onRename,
  onRemove,
  shareLabel = 'Jaa lista',
}) => {
  const theme = useTheme()

  const actionCallbacks: Record<string, () => void> = {
    onShare: onShare || (() => {}),
    onEdit: onEdit || (() => {}),
    onRename: onRename || (() => {}),
    onRemove: onRemove || (() => {}),
  }

  const actions: ActionButton[] = actionIds
    .map((id) => {
      const definition = ACTION_DEFINITIONS[id]
      if (!definition) return null
      const { onPressKey, ...rest } = definition
      return {
        ...rest,
        label: id === 'share' ? shareLabel : rest.label, // Käytetään mukautettua labelia jakotoiminnolle
        onPress: actionCallbacks[onPressKey] as () => void,
      }
    })
    .filter((action): action is ActionButton => action !== null)

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.touchableOverlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.handleBar} />
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
          <ScrollView style={styles.actionsContainer}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                onPress={() => {
                  action.onPress()
                  onClose()
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
          <Button mode="outlined" onPress={onClose} style={styles.closeButton}>
            Sulje
          </Button>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  touchableOverlay: {
    flex: 1,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 8,
  },
});