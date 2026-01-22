import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Text, Avatar, useTheme, Checkbox } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActionModal } from "./ActionModal";

interface ListButtonProps {
  listName: string
  itemsDone?: number
  itemsTotal?: number
  imageUrl?: string
  ownerAvatar?: string
  ownerInitials?: string
  onPress?: () => void
  onMenuPress?: () => void
  onDelete?: () => void
  onShare?: () => void
  onEdit?: () => void
  isRecipe?: boolean
  customActionIds?: string[]
  onRestore?: () => void
  onPermanentlyDelete?: () => void
  showCheckbox?: boolean
  isChecked?: boolean
  onCheckChange?: (checked: boolean) => void
  removeLabel?: string
  createdAt?: Date
}

export const ListButton: React.FC<ListButtonProps> = ({
  listName,
  imageUrl,
  ownerAvatar,
  ownerInitials = "?",
  onPress,
  onMenuPress,
  onDelete,
  onShare,
  onEdit,
  isRecipe = false,
  customActionIds,
  onRestore,
  onPermanentlyDelete,
  showCheckbox = false,
  isChecked = false,
  onCheckChange,
  removeLabel = 'Poista lista',
  createdAt,
}) => {
  const theme = useTheme()
  const [modalVisible, setModalVisible] = useState(false)

  const actionIds = customActionIds || (isRecipe ? ['shareRecipe', 'editRecipe', 'deleteRecipe'] : ['share', 'remove'])

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.colors.primaryContainer }]}>
        <TouchableOpacity onPress={onPress} style={styles.touchableArea} activeOpacity={0.7}>
          {imageUrl && (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
              />
            </View>
          )}
          <View style={styles.contentWrapper}>
            <Text
              style={[
                styles.listName,
                { color: theme.colors.onSurface },
              ]}
              numberOfLines={2}
            >
              {listName}
            </Text>
            {createdAt && (
              <Text
                style={[
                  styles.createdAt,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Luotu {new Date(createdAt).toLocaleDateString('fi-FI')}
              </Text>
            )}
            <View style={styles.avatarWrapper}>
              {ownerAvatar ? (
                <Avatar.Image
                  size={24}
                  source={{ uri: ownerAvatar }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Text
                  size={24}
                  label={ownerInitials}
                  style={[
                    styles.avatar,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  labelStyle={{ color: theme.colors.onPrimary }}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {showCheckbox && (
          <View style={{ backgroundColor: 'white', borderRadius: 4 }}>
            <Checkbox
              status={isChecked ? "checked" : "unchecked"}
              onPress={() => onCheckChange?.(!isChecked)}
              color={theme.colors.primary}
              uncheckedColor={theme.colors.primary}
            />
          </View>
        )}

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.menuIconWrapper}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color={theme.colors.onSurface}
          />
        </TouchableOpacity>
      </View>

      <ActionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={listName}
        actionIds={actionIds}
        onShare={onShare}
        onRemove={onDelete}
        onShareRecipe={onShare}
        onEditRecipe={onEdit}
        onDeleteRecipe={onDelete}
        onRestore={onRestore}
        onPermanentlyDelete={onPermanentlyDelete}
        removeLabel={removeLabel}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  touchableArea: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  imageWrapper: {
    marginRight: 12,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "flex-start",
  },
  listName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  createdAt: {
    fontSize: 12,
    marginTop: 2,
  },
  itemsCount: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  avatarWrapper: {
    alignItems: "flex-start",
  },
  avatar: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  menuIconWrapper: {
    padding: 8,
  },
})
