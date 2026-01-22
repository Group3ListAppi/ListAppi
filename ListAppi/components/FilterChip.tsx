import React from "react";
import { Chip, useTheme } from "react-native-paper";

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected,
  onPress,
}) => {
  const theme = useTheme();

  return (
    <Chip
      selected={selected}
      onPress={onPress}
      selectedColor="black"
      style={
        selected
          ? { backgroundColor: theme.colors.primaryContainer }
          : {
              backgroundColor: theme.colors.surface,
              borderWidth: 2,
              borderColor: theme.colors.primaryContainer,
            }
      }
      textStyle={
        selected
          ? { color: "black" }
          : { color: "#FFFFFF" }
      }
    >
      {label}
    </Chip>
  );
};
