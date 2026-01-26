import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ModalBase } from "./ModalBase";

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
  onCamera?: () => void
  onGallery?: () => void
  onShareRecipe?: () => void
  onEditRecipe?: () => void
  onDeleteRecipe?: () => void
  onRestore?: () => void
  onPermanentlyDelete?: () => void
  shareLabel?: string
  removeLabel?: string
  restoreLabel?: string
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
    camera: {
        id: 'camera',
        label: 'Kamera',
        icon: 'camera',
        onPressKey: 'onCamera',
    },
    gallery: {
        id: 'gallery',
        label: 'Galleria',
        icon: 'image',
        onPressKey: 'onGallery',
    },
    shareRecipe: {
        id: 'shareRecipe',
        label: 'Jaa resepti',
        icon: 'share-variant',
        onPressKey: 'onShareRecipe',
    },
    editRecipe: {
        id: 'editRecipe',
        label: 'Muokkaa reseptiä',
        icon: 'pencil',
        onPressKey: 'onEditRecipe',
    },
    deleteRecipe: {
        id: 'deleteRecipe',
        label: 'Poista resepti',
        icon: 'trash-can-outline',
        onPressKey: 'onDeleteRecipe',
    },
    restore: {
        id: 'restore',
        label: 'Palauta resepti',
        icon: 'restore',
        onPressKey: 'onRestore',
    },
    deletePermanent: {
        id: 'deletePermanent',
        label: 'Poista pysyvästi',
        icon: 'delete-forever',
        onPressKey: 'onPermanentlyDelete',
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
  onSettings,
  onLogout,
  onCamera,
  onGallery,
  onShareRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onRestore,
  onPermanentlyDelete,
  shareLabel = 'Jaa lista',
  removeLabel = 'Poista lista',
  restoreLabel = 'Palauta resepti',
}) => {
  const theme = useTheme()

  const actionCallbacks: Record<string, () => void> = {
    onShare: onShare || (() => {}),
    onEdit: onEdit || (() => {}),
    onRename: onRename || (() => {}),
    onRemove: onRemove || (() => {}),
    onSettings: onSettings || (() => {}),
    onLogout: onLogout || (() => {}),
    onCamera: onCamera || (() => {}),
    onGallery: onGallery || (() => {}),
    onShareRecipe: onShareRecipe || (() => {}),
    onEditRecipe: onEditRecipe || (() => {}),
    onDeleteRecipe: onDeleteRecipe || (() => {}),
    onRestore: onRestore || (() => {}),
    onPermanentlyDelete: onPermanentlyDelete || (() => {}),
  }

  const actions: ActionButton[] = actionIds
    .map((id) => {
      const definition = ACTION_DEFINITIONS[id]
      if (!definition) return null
      const { onPressKey, ...rest } = definition
      return {
        ...rest,
        label: id === 'share' ? shareLabel : (id === 'remove' ? removeLabel : (id === 'restore' ? restoreLabel : rest.label)),
        onPress: actionCallbacks[onPressKey] as () => void,
      }
    })
    .filter((action): action is ActionButton => action !== null)

  return (
    <ModalBase visible={visible} onClose={onClose} title={title}>
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
    </ModalBase>
  )
}

const styles = StyleSheet.create({
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
})