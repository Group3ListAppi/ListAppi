import React from "react";
import { StyleSheet, TouchableOpacity, Image, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

interface RecipeButtonProps {
  title: string;
  imageUrl?: string;
  onPress?: () => void;
}

export const RecipeButton: React.FC<RecipeButtonProps> = ({
  title,
  imageUrl,
  onPress,
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.container, { backgroundColor: theme.colors.primaryContainer }]}> 
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
          />
        )}
        <Text
          style={[styles.title, { color: theme.colors.onSurface }]}
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 120,
  },
  title: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "600",
  },
});
