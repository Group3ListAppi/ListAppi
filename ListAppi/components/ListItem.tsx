import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Text, Checkbox, useTheme } from "react-native-paper";

interface ListItemProps {
  title: string;
  imageUrl?: string;
  isChecked?: boolean;
  onCheckChange?: (checked: boolean) => void;
  onPress?: () => void;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  imageUrl,
  isChecked = false,
  onCheckChange,
  onPress,
}) => {
  const theme = useTheme();
  const [checked, setChecked] = useState(isChecked);

  const handleCheckChange = (newValue: boolean) => {
    setChecked(newValue);
    onCheckChange?.(newValue);
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
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
  );
};

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
