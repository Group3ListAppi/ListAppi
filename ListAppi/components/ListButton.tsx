import React, { useState, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Image, Animated, PanResponder, Dimensions } from "react-native";
import { Text, Avatar, useTheme, Checkbox } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActionModal } from "./ActionModal";
import { ShareModal } from "./ShareModal";

const SCREEN_WIDTH = Dimensions.get('window').width;
const ACTION_BUTTON_WIDTH = 60;
const LIST_BUTTON_HEIGHT = 88;

interface ListButtonProps {
  listName: string
  itemsDone?: number
  itemsTotal?: number
  imageUrl?: string
  ownerAvatar?: string
  ownerInitials?: string
  ownerName?: string
  sharedUserAvatars?: Array<{ displayName?: string; photoURL?: string }>
  isOwnedByUser?: boolean
  onPress?: () => void
  onLongPress?: () => void
  onMenuPress?: () => void
  onDelete?: () => void
  onShare?: () => void
  onEdit?: () => void
  onStopSharing?: () => void
  onShareComplete?: () => void
  isRecipe?: boolean
  customActionIds?: string[]
  onRestore?: () => void
  onPermanentlyDelete?: () => void
  showCheckbox?: boolean
  isChecked?: boolean
  onCheckChange?: (checked: boolean) => void
  showRadioButton?: boolean
  isRadioSelected?: boolean
  removeLabel?: string
  editLabel?: string
  shareLabel?: string
  restoreLabel?: string
  createdAt?: Date
  itemId?: string
  itemType?: 'recipe' | 'recipeCollection' | 'shoplist' | 'menu'
  isDefault?: boolean
  disableSwipe?: boolean
}

export const ListButton: React.FC<ListButtonProps> = ({
  listName,
  imageUrl,
  ownerAvatar,
  ownerInitials = "?",
  ownerName,
  sharedUserAvatars,
  isOwnedByUser = false,
  onPress,
  onLongPress,
  onMenuPress,
  onDelete,
  onShare,
  onEdit,
  onStopSharing,
  onShareComplete,
  isRecipe = false,
  customActionIds,
  onRestore,
  onPermanentlyDelete,
  showCheckbox = false,
  isChecked = false,
  onCheckChange,
  showRadioButton = false,
  isRadioSelected = false,
  removeLabel = 'Poista lista',
  editLabel,
  shareLabel,
  restoreLabel = 'Palauta resepti',
  createdAt,
  itemId,
  itemType,
  isDefault = false,
  disableSwipe = false,
}) => {
  const theme = useTheme()
  const [modalVisible, setModalVisible] = useState(false)
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const translateX = useRef(new Animated.Value(0)).current
  const resolvedEditLabel = editLabel ?? (itemType === 'recipeCollection' ? 'Muokkaa nimeä' : 'Muokkaa')

  // Pysäytyskohta pyyhkäisyanimaatiolle (poistettu, palautetaan aina alkuun jos ei poisteta)
  const DELETE_THRESHOLD = -(SCREEN_WIDTH / 2) // Pyyhkäisy yli puolivälin poistaa kohteen

  // Check if item has shared users or is shared with current user
  const hasSharing = (sharedUserAvatars && sharedUserAvatars.length > 0) || !isOwnedByUser
  
  // Piilota jako-toiminto, jos ei omisteta, lisää stopSharing jos on jako aktiivinen
  // For default collections, exclude delete actions
  // Non-owners can only stop sharing
  const actionIds = customActionIds || (
    !isOwnedByUser
      ? ['stopSharing']  // Non-owners can only stop sharing
      : isDefault 
        ? (isRecipe 
            ? (hasSharing ? ['shareRecipe', 'stopSharing', 'editRecipe'] : ['shareRecipe', 'editRecipe'])
            : (hasSharing ? ['share', 'stopSharing', 'edit'] : ['share', 'edit']))
        : (isRecipe 
            ? (hasSharing ? ['shareRecipe', 'stopSharing', 'editRecipe', 'deleteRecipe'] : ['shareRecipe', 'editRecipe', 'deleteRecipe'])
            : (hasSharing ? ['share', 'stopSharing', 'edit', 'remove'] : ['share', 'edit', 'remove']))
  )

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (disableSwipe) return false
        return Math.abs(gestureState.dx) > 5
      },
      onPanResponderMove: (_, gestureState) => {
        if (disableSwipe) return
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (disableSwipe) return
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

  return (
    <>
      <View style={styles.swipeContainer}>
        {onDelete && !isDefault && (
          <View style={styles.actionsContainer} pointerEvents="none">
            <View style={[styles.actionButton, styles.lastActionButton, { backgroundColor: '#F44336' }]}
              pointerEvents="none"
            >
              <MaterialCommunityIcons name="delete" size={24} color="white" />
            </View>
          </View>
        )}
        <Animated.View
          style={[
            styles.animatedRow,
            { transform: [{ translateX }] }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Main ListButton */}
          <View style={[
            styles.container,
            imageUrl ? styles.containerWithImage : styles.containerNoImage,
            { backgroundColor: theme.colors.primaryContainer }
          ]}> 
            <TouchableOpacity 
              onPress={onPress} 
              onLongPress={onLongPress}
              style={styles.touchableArea} 
              activeOpacity={0.7}
            >
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
                  {isOwnedByUser && sharedUserAvatars && sharedUserAvatars.length > 0 ? (
                    // Näytä omistajan avatar + jaettujen käyttäjien avatarit omistetuille kohteille
                    <View style={styles.sharedUsersContainer}>
                      {/* Omistajan avatar (suurempi) */}
                      {ownerAvatar ? (
                        <Avatar.Image
                          size={28}
                          source={{ uri: ownerAvatar }}
                          style={styles.ownerAvatar}
                        />
                      ) : (
                        <Avatar.Text
                          size={28}
                          label={ownerInitials}
                          style={[
                            styles.ownerAvatar,
                            { backgroundColor: theme.colors.primary },
                          ]}
                          labelStyle={{ color: theme.colors.onPrimary }}
                        />
                      )}
                      {/* Jaetut käyttäjät (pienemmät avatarit) */}
                      {sharedUserAvatars.slice(0, 3).map((sharedUser, index) => (
                        sharedUser.photoURL ? (
                          <Avatar.Image
                            key={index}
                            size={20}
                            source={{ uri: sharedUser.photoURL }}
                            style={styles.sharedAvatar}
                          />
                        ) : (
                          <Avatar.Text
                            key={index}
                            size={20}
                            label={sharedUser.displayName?.charAt(0).toUpperCase() || "?"}
                            style={[
                              styles.sharedAvatar,
                              { backgroundColor: theme.colors.primary },
                            ]}
                            labelStyle={{ color: theme.colors.onPrimary, fontSize: 10 }}
                          />
                        )
                      ))}
                      {sharedUserAvatars.length > 3 && (
                        <Avatar.Text
                          size={20}
                          label={`+${sharedUserAvatars.length - 3}`}
                          style={[
                            styles.sharedAvatar,
                            { backgroundColor: theme.colors.surfaceVariant },
                          ]}
                          labelStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 9 }}
                        />
                      )}
                    </View>
                  ) : isOwnedByUser ? (
                    // Omistettu kohde ilman jakoja - näytä vain avatar ilman nimeä
                    <>
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
                    </>
                  ) : (
                    // Jaettu kohde - näytä omistajan avatar ja nimi
                    <>
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
                      {ownerName && (
                        <Text
                          style={[
                            styles.ownerName,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
                          numberOfLines={1}
                        >
                          {ownerName}
                        </Text>
                      )}
                    </>
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

            {showRadioButton && (
              <TouchableOpacity
                onPress={onPress}
                style={styles.radioButtonWrapper}
              >
                <View style={[
                  styles.radioButton,
                  { borderColor: theme.colors.primary }
                ]}>
                  {isRadioSelected && (
                    <View style={[
                      styles.radioButtonInner,
                      { backgroundColor: theme.colors.primary }
                    ]} />
                  )}
                </View>
              </TouchableOpacity>
            )}

            {!showCheckbox && !showRadioButton && (
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
        onEdit={onEdit}
        onRemove={onDelete}
        onShareRecipe={() => setShareModalVisible(true)}
        onEditRecipe={onEdit}
        onDeleteRecipe={onDelete}
        onRestore={onRestore}
        onPermanentlyDelete={onPermanentlyDelete}
        onStopSharing={onStopSharing}
        shareLabel={shareLabel}
        editLabel={resolvedEditLabel}
        removeLabel={removeLabel}
        restoreLabel={restoreLabel}
      />

      <ShareModal
        visible={shareModalVisible}
        itemId={itemId}
        itemType={itemType}
        onClose={() => setShareModalVisible(false)}
        onShareComplete={onShareComplete}
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
    borderRadius: 8,
    position: 'relative',
  },
  animatedRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    position: 'relative',
    borderRadius: 8,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 16,
    paddingVertical: 12,
    borderRadius: 8,
    width: SCREEN_WIDTH - 32,
    height: LIST_BUTTON_HEIGHT,
    zIndex: 1,
  },
  containerWithImage: {
    paddingLeft: 0,
    paddingVertical: 0,
  },
  containerNoImage: {
    paddingLeft: 16,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    alignItems: 'stretch',
    justifyContent: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 0,
  },
  actionButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  firstActionButton: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  lastActionButton: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  touchableArea: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  imageWrapper: {
    marginRight: 12,
    alignSelf: "stretch",
    width: 100,
    height: "100%",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    flex: 1,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  ownerAvatar: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  sharedUsersContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sharedAvatar: {
    marginLeft: -8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  ownerName: {
    fontSize: 12,
  },
  menuIconWrapper: {
    padding: 8,
  },
  radioButtonWrapper: {
    padding: 8,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
})
