import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Text, Avatar, useTheme } from "react-native-paper";
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
}) => {
  const theme = useTheme()
  const [modalVisible, setModalVisible] = useState(false)

  const actionIds = customActionIds || (isRecipe ? ['shareRecipe', 'editRecipe', 'deleteRecipe'] : ['share', 'remove'])

  return (
    <>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.container, { backgroundColor: theme.colors.primaryContainer }]}>
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
                { color: theme.colors.onPrimaryContainer },
              ]}
              numberOfLines={2}
            >
              {listName}
            </Text>
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
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={styles.menuIconWrapper}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="dots-vertical"
              size={24}
              color={theme.colors.onPrimaryContainer}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

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
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
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
