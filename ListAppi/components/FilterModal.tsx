import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, useTheme, Chip } from "react-native-paper";
import { ModalBase } from "./ModalBase";

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

const MEAL_TYPES = [
  "airfryer-ruoat",
  "keitot",
  "salaatit",
  "pastat",
  "hampurilaiset",
  "pihvit",
  "uuniruoat",
  "pataruoat",
  "tacot ja tortillat",
  "muu",
];

const MEAL_TYPE_LABELS: Record<string, string> = {
  "airfryer-ruoat": "Airfryer-ruoat",
  keitot: "Keitot",
  salaatit: "Salaatit",
  pastat: "Pastat",
  hampurilaiset: "Hampurilaiset",
  pihvit: "Pihvit",
  uuniruoat: "Uuniruoat",
  pataruoat: "Pataruoat",
  "tacot ja tortillat": "Tacot ja tortillat",
  muu: "Muu",
};

const MAIN_INGREDIENTS = [
  "liha",
  "jauheliha",
  "makkara",
  "broileri",
  "kala",
  "äyriäiset",
  "kananmuna",
  "kasvis",
  "kasviproteiini",
  "muu",
];

const MAIN_INGREDIENT_LABELS: Record<string, string> = {
  liha: "Liha",
  jauheliha: "Jauheliha",
  makkara: "Makkara",
  broileri: "Broileri",
  kala: "Kala",
  äyriäiset: "Äyriäiset",
  kananmuna: "Kananmuna",
  kasvis: "Kasvis",
  kasviproteiini: "Kasviproteiini",
  muu: "Muu",
};

const DIET_TYPES = [
  "gluteeniton",
  "kananmunaton",
  "kasvis",
  "laktoositon",
  "maidoton",
  "vegaaninen",
];

const DIET_TYPE_LABELS: Record<string, string> = {
  gluteeniton: "Gluteeniton",
  kananmunaton: "Kananmunaton",
  kasvis: "Kasvis",
  laktoositon: "Laktoositon",
  maidoton: "Maidoton",
  vegaaninen: "Vegaaninen",
};

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  selectedFilters,
}) => {
  const theme = useTheme();
  const [filters, setFilters] = useState<FilterOptions>(selectedFilters);

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
        <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Ruokalaji
        </Text>
        <View style={styles.chipRow}>
          {MEAL_TYPES.map((mealType) => (
            <Chip
              key={mealType}
              selected={filters.mealTypes.includes(mealType)}
              onPress={() => handleMealTypeToggle(mealType)}
              selectedColor="black"
              style={
                filters.mealTypes.includes(mealType)
                  ? { backgroundColor: theme.colors.primaryContainer }
                  : {
                      backgroundColor: theme.colors.surface,
                      borderWidth: 2,
                      borderColor: theme.colors.primaryContainer,
                    }
              }
              textStyle={
                filters.mealTypes.includes(mealType)
                  ? { color: "black" }
                  : { color: "#FFFFFF" }
              }
            >
              {MEAL_TYPE_LABELS[mealType]}
            </Chip>
          ))}
        </View>

        <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Pääraaka-aine
        </Text>
        <View style={styles.chipRow}>
          {MAIN_INGREDIENTS.map((ingredient) => (
            <Chip
              key={ingredient}
              selected={filters.mainIngredients.includes(ingredient)}
              onPress={() => handleMainIngredientToggle(ingredient)}
              selectedColor="black"
              style={
                filters.mainIngredients.includes(ingredient)
                  ? { backgroundColor: theme.colors.primaryContainer }
                  : {
                      backgroundColor: theme.colors.surface,
                      borderWidth: 2,
                      borderColor: theme.colors.primaryContainer,
                    }
              }
              textStyle={
                filters.mainIngredients.includes(ingredient)
                  ? { color: "black" }
                  : { color: "#FFFFFF" }
              }
            >
              {MAIN_INGREDIENT_LABELS[ingredient]}
            </Chip>
          ))}
        </View>

        <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Ruokavaliot
        </Text>
        <View style={styles.chipRow}>
          {DIET_TYPES.map((dietType) => (
            <Chip
              key={dietType}
              selected={filters.dietTypes.includes(dietType)}
              onPress={() => handleDietTypeToggle(dietType)}
              selectedColor="black"
              style={
                filters.dietTypes.includes(dietType)
                  ? { backgroundColor: theme.colors.primaryContainer }
                  : {
                      backgroundColor: theme.colors.surface,
                      borderWidth: 2,
                      borderColor: theme.colors.primaryContainer,
                    }
              }
              textStyle={
                filters.dietTypes.includes(dietType)
                  ? { color: "black" }
                  : { color: "#FFFFFF" }
              }
            >
              {DIET_TYPE_LABELS[dietType]}
            </Chip>
          ))}
        </View>

        <Chip
          icon="check"
          style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
          textStyle={[styles.applyButtonText, { color: theme.colors.onPrimary }]}
          onPress={handleApply}
        >
          Käytä suodattimia
        </Chip>

        <Chip
          icon="close"
          disabled={!hasActiveFilters}
          style={[
            styles.clearButton,
            hasActiveFilters
              ? { backgroundColor: '#FFE0E0' }
              : { 
                  backgroundColor: '#333333',
                  borderWidth: 2,
                  borderColor: '#FFB3B3'
                }
          ]}
          textStyle={[
            styles.clearButtonText,
            hasActiveFilters
              ? { color: 'black' }
              : { color: 'white' }
          ]}
          onPress={handleClearFilters}
        >
          Tyhjennä suodattimet
        </Chip>
      </ScrollView>
    </ModalBase>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
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
  applyButton: {
    marginHorizontal: 16,
    marginVertical: 16,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  clearButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    marginBottom: 16,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});