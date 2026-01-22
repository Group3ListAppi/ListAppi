import React from "react";
import { StyleSheet } from "react-native";
import { Searchbar, useTheme } from "react-native-paper";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Hae...",
}) => {
  const theme = useTheme();

  return (
    <Searchbar
      placeholder={placeholder}
      onChangeText={onChangeText}
      value={value}
      style={[
        styles.searchbar,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.primary,
          borderWidth: 1,
        },
      ]}
      inputStyle={{
        minHeight: 0,
        paddingBottom: 0,
        paddingTop: 0,
        alignSelf: "center",
      }}
    />
  );
};

const styles = StyleSheet.create({
  searchbar: {
    flex: 1,
    height: 40,
  },
});
