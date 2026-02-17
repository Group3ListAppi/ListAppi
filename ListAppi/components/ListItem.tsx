import React, { useState, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Image, Animated, PanResponder, Dimensions } from "react-native";
import { Text, Checkbox, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ListItemProps {
  title: string;
  imageUrl?: string;
  isChecked?: boolean;
  onCheckChange?: (checked: boolean) => void;
  onPress?: () => void;
  onLongPress?: () => void; 
  delayLongPress?: number;
  onDelete?: () => void;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  imageUrl,
  isChecked = false,
  onCheckChange,
  onPress,
  onLongPress, 
  delayLongPress = 400,
  onDelete,
}) => {
  const theme = useTheme();
  const [checked, setChecked] = useState(isChecked);
  const translateX = useRef(new Animated.Value(0)).current;

  const DELETE_THRESHOLD = -(SCREEN_WIDTH / 2);

  const handleCheckChange = (newValue: boolean) => {
    setChecked(newValue);
    onCheckChange?.(newValue);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!onDelete) return false;
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!onDelete) return;
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!onDelete) return;
        const swipeDistance = gestureState.dx;
        
        if (swipeDistance < DELETE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH - 100,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            if (onDelete) {
              onDelete();
            }
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.swipeContainer}>
      {onDelete && (
        <View style={styles.actionsContainer} pointerEvents="none">
          <View style={[styles.actionButton, { backgroundColor: '#F44336' }]} pointerEvents="none">
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
        <TouchableOpacity 
          onPress={onPress}
          onLongPress={onLongPress} 
          delayLongPress={delayLongPress} 
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.container,
              {
                backgroundColor: checked
                  ? theme.colors.primaryContainer
                  : theme.colors.surface,
              },
            ]}
          >
            {imageUrl && (
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                />
              </View>
            )}

            <Text
              style={[
                styles.title,
                {
                  color: theme.colors.onSurface,
                  textDecorationLine: checked ? "line-through" : "none",
                },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>

            <Checkbox
              status={checked ? "checked" : "unchecked"}
              onPress={() => handleCheckChange(!checked)}
              color={theme.colors.primary}
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

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
    borderRadius: 8,
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
  imageWrapper: {
    marginRight: 12,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
});
