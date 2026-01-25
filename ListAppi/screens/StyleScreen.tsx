import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, View, Pressable } from "react-native";
import { Text, useTheme, RadioButton } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ScreenLayout from "../components/ScreenLayout";
import { themes, ThemeKey } from "../theme";

type Props = {
  activeScreen: string
  onBack: () => void
  onNavigate: (screen: string) => void
  onThemeChange?: (themeKey: ThemeKey) => void
}

export default function StyleScreen({ activeScreen, onBack, onNavigate, onThemeChange }: Props) {
  const theme = useTheme()
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("dark")

  // Lataa tallennettu teema
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem("selectedTheme")
        if (saved) {
          setSelectedTheme(saved as ThemeKey)
        }
      } catch (error) {
        console.log("Error loading theme:", error)
      }
    }
    loadTheme()
  }, [])

  const handleThemeSelect = async (themeKey: ThemeKey) => {
    try {
      setSelectedTheme(themeKey)
      await AsyncStorage.setItem("selectedTheme", themeKey)
      onThemeChange?.(themeKey)
    } catch (error) {
      console.log("Error saving theme:", error)
    }
  }

  const themeOptions: { key: ThemeKey; label: string; description: string; }[] = [
    {
      key: "dark",
      label: "Tumma",
      description: "Tumma teema vihreillä aksenteilla",
    },
    {
      key: "light",
      label: "Vaalea",
      description: "Vaalea teema vihreillä aksenteilla",
    },
    {
      key: "blue",
      label: "Sininen",
      description: "Tumma teema sinisillä aksenteilla",
    },
    {
      key: "purple",
      label: "Violetti",
      description: "Tumma teema violeteilla aksenteilla",
    },
  ]

  return (
    <ScreenLayout 
      activeScreen={activeScreen} 
      onNavigate={onNavigate} 
      showNav={false}
      showBack={true}
      onBack={onBack}
      customTitle="Tyyli"
    >
      <ScrollView style={styles.content}>
        <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          Valitse sovelluksen ulkoasu
        </Text>

        <View style={styles.optionsContainer}>
          {themeOptions.map((option) => (
            <Pressable
              key={option.key}
              style={[
                styles.themeOption,
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: selectedTheme === option.key ? theme.colors.primary : theme.colors.outline,
                  borderWidth: selectedTheme === option.key ? 2 : 1,
                }
              ]}
              onPress={() => handleThemeSelect(option.key)}
            >
              <View style={styles.themeInfo}>
                <View style={styles.colorPreview}>
                  <View 
                    style={[
                      styles.colorSwatch, 
                      { backgroundColor: themes[option.key].colors.background }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.colorSwatch, 
                      { backgroundColor: themes[option.key].colors.primary }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.colorSwatch, 
                      { backgroundColor: themes[option.key].colors.primaryContainer }
                    ]} 
                  />
                </View>
                <View style={styles.themeText}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                    {option.label}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {option.description}
                  </Text>
                </View>
              </View>
              <RadioButton
                value={option.key}
                status={selectedTheme === option.key ? "checked" : "unchecked"}
                onPress={() => handleThemeSelect(option.key)}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
  },
  themeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 16,
  },
  colorPreview: {
    flexDirection: "row",
    gap: 4,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  themeText: {
    flex: 1,
    gap: 4,
  },
  noteContainer: {
    marginTop: 32,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
})
