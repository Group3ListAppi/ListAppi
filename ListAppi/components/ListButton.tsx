import React, { useState, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Image, Animated, PanResponder, Dimensions } from "react-native";
import { Text, Avatar, useTheme, Checkbox } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActionModal } from "./ActionModal";
import { ShareModal } from "./ShareModal";

const SCREEN_WIDTH = Dimensions.get('window').width;
const ACTION_BUTTON_WIDTH = 60;

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
  restoreLabel?: string
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
  restoreLabel = 'Palauta resepti',
  createdAt,
}) => {
  const theme = useTheme()
  const [modalVisible, setModalVisible] = useState(false)
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const translateX = useRef(new Animated.Value(0)).current

  // Laskee kuinka monta toimintopainiketta näytetään
  let buttonCount = 0
  if (onShare) buttonCount++
  if (onEdit) buttonCount++
  if (onDelete) buttonCount++

  // Pysäytyskohta pyyhkäisyanimaatiolle
  const STOP_POSITION = -(buttonCount * ACTION_BUTTON_WIDTH)
  const DELETE_THRESHOLD = STOP_POSITION - 80 // Pyyhkäisy yli tämän arvon poistaa kohteen

  const actionIds = customActionIds || (isRecipe ? ['shareRecipe', 'editRecipe', 'deleteRecipe'] : ['share', 'remove'])

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeDistance = gestureState.dx
        
        if (swipeDistance < DELETE_THRESHOLD) {
          // Pyyhkäisy yli kynnysarvon, käynnistää poistoanimaation
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH - 100,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            if (onDelete) {
              onDelete()
            }
          })
        } else if (swipeDistance < -50) {
          // Pysäytyskohta pyyhkäisyanimaatiolle
          Animated.spring(translateX, {
            toValue: STOP_POSITION,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start()
        } else {
          // Palauta alkuperäiseen paikkaan
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start()
        }
      },
    })
  ).current

  const handleActionPress = (action?: () => void, isShareAction?: boolean) => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start()
    if (isShareAction) {
      setShareModalVisible(true)
    } else if (action) {
      action()
    }
  }

  return (
    <>
      <View style={styles.swipeContainer}>
        <Animated.View
          style={[
            styles.animatedRow,
            { transform: [{ translateX }] }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Main ListButton */}
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

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {onShare && (
              <TouchableOpacity
                style={[styles.actionButton, styles.firstActionButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => handleActionPress(undefined, true)}
              >
                <MaterialCommunityIcons name="share-variant" size={24} color="white" />
              </TouchableOpacity>
            )}
            {onEdit && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                onPress={() => handleActionPress(onEdit)}
              >
                <MaterialCommunityIcons name="pencil" size={24} color="white" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.lastActionButton, { backgroundColor: '#F44336' }]}
                onPress={() => handleActionPress(onDelete)}
              >
                <MaterialCommunityIcons name="delete" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>

      <ActionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={listName}
        actionIds={actionIds}
        onShare={() => setShareModalVisible(true)}
        onRemove={onDelete}
        onShareRecipe={() => setShareModalVisible(true)}
        onEditRecipe={onEdit}
        onDeleteRecipe={onDelete}
        onRestore={onRestore}
        onPermanentlyDelete={onPermanentlyDelete}
        removeLabel={removeLabel}
        restoreLabel={restoreLabel}
      />

      <ShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        title={listName}
      />
    </>
  )
}

const styles = StyleSheet.create({
  swipeContainer: {
    marginVertical: 4,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  animatedRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    width: SCREEN_WIDTH - 32,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actionButton: {
    width: ACTION_BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  firstActionButton: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  lastActionButton: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    width: 340,
    alignItems: 'flex-start',
    paddingLeft: 20,
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
