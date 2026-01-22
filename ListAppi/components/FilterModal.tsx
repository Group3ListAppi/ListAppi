import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { ModalBase } from "./ModalBase";
import { SubmitButton } from "./SubmitButton";
import { FilterChip } from "./FilterChip";
import {
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
  MAIN_INGREDIENTS,
  MAIN_INGREDIENT_LABELS,
  DIET_TYPES,
  DIET_TYPE_LABELS,
} from "../types/filterConstants";

export interface FilterOptions {
  mealTypes: string[];
  mainIngredients: string[];
  dietTypes: string[];
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  selectedFilters: FilterOptions;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  selectedFilters,
}) => {
  const theme = useTheme();
  const [filters, setFilters] = useState<FilterOptions>(selectedFilters);

  useEffect(() => {
    if (visible) {
      setFilters(selectedFilters);
    }
  }, [visible, selectedFilters]);

  const handleMealTypeToggle = (mealType: string) => {
    setFilters((prev) => ({
      ...prev,
      mealTypes: prev.mealTypes.includes(mealType)
        ? prev.mealTypes.filter((m) => m !== mealType)
        : [...prev.mealTypes, mealType],
    }));
  };

  const handleMainIngredientToggle = (ingredient: string) => {
    setFilters((prev) => ({
      ...prev,
      mainIngredients: prev.mainIngredients.includes(ingredient)
        ? prev.mainIngredients.filter((i) => i !== ingredient)
        : [...prev.mainIngredients, ingredient],
    }));
  };

  const handleDietTypeToggle = (dietType: string) => {
    setFilters((prev) => ({
      ...prev,
      dietTypes: prev.dietTypes.includes(dietType)
        ? prev.dietTypes.filter((d) => d !== dietType)
        : [...prev.dietTypes, dietType],
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClearFilters = () => {
    setFilters({
      mealTypes: [],
      mainIngredients: [],
      dietTypes: [],
    });
  };

  const hasActiveFilters = filters.mealTypes.length > 0 || filters.mainIngredients.length > 0 || filters.dietTypes.length > 0;

  return (
    <ModalBase visible={visible} onClose={onClose} title="Suodata reseptejä">
      <ScrollView contentContainerStyle={styles.container} scrollEnabled={true}>
        <Text variant="titleSmall" style={[styles.sectionTitle,]}>
          Ruokalaji
        </Text>
        <View style={styles.chipRow}>
          {MEAL_TYPES.map((mealType) => (
            <FilterChip
              key={mealType}
              label={MEAL_TYPE_LABELS[mealType]}
              selected={filters.mealTypes.includes(mealType)}
              onPress={() => handleMealTypeToggle(mealType)}
            />
          ))}
        </View>

        <Text variant="titleSmall" style={[styles.sectionTitle,]}>
          Pääraaka-aine
        </Text>
        <View style={styles.chipRow}>
          {MAIN_INGREDIENTS.map((ingredient) => (
            <FilterChip
              key={ingredient}
              label={MAIN_INGREDIENT_LABELS[ingredient]}
              selected={filters.mainIngredients.includes(ingredient)}
              onPress={() => handleMainIngredientToggle(ingredient)}
            />
          ))}
        </View>

        <Text variant="titleSmall" style={[styles.sectionTitle,]}>
          Ruokavaliot
        </Text>
        <View style={styles.chipRow}>
          {DIET_TYPES.map((dietType) => (
            <FilterChip
              key={dietType}
              label={DIET_TYPE_LABELS[dietType]}
              selected={filters.dietTypes.includes(dietType)}
              onPress={() => handleDietTypeToggle(dietType)}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <SubmitButton
            text="Käytä suodattimia"
            onPress={handleApply}
          />
        </View>

        <View style={styles.buttonContainer}>
          <SubmitButton
            text="Tyhjennä suodattimet"
            onPress={handleClearFilters}
            disabled={!hasActiveFilters}
            variant="danger"
          />
        </View>
      </ScrollView>
    </ModalBase>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 0,
    paddingBottom: 50,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    fontWeight: "600",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    gap: 8,
    marginBottom: 8,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
});