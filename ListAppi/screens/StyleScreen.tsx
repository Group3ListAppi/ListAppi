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
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark")
  const [selectedColor, setSelectedColor] = useState<"green" | "blue" | "purple">("green")

  // Lataa tallennettu teema
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem("selectedTheme")
        if (saved) {
          setSelectedTheme(saved as ThemeKey)
          // Määrittää moodin tallennetusta teemasta
          if (saved === "light" || saved === "lightBlue" || saved === "lightPurple") {
            setThemeMode("light")
          } else {
            setThemeMode("dark")
          }
          // Määrittää värin tallennetusta teemasta
          if (saved === "blue" || saved === "lightBlue") {
            setSelectedColor("blue")
          } else if (saved === "purple" || saved === "lightPurple") {
            setSelectedColor("purple")
          } else {
            setSelectedColor("green")
          }
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

  const handleColorChange = (color: "green" | "blue" | "purple") => {
    setSelectedColor(color)
    // Määrittää teeman avaimen värin ja nykyisen moodin perusteella
    let newTheme: ThemeKey
    if (color === "green") {
      newTheme = themeMode === "dark" ? "dark" : "light"
    } else if (color === "blue") {
      newTheme = themeMode === "dark" ? "blue" : "lightBlue"
    } else {
      newTheme = themeMode === "dark" ? "purple" : "lightPurple"
    }
    handleThemeSelect(newTheme)
  }

  const handleModeChange = (mode: "dark" | "light") => {
    setThemeMode(mode)
    // Rakentaa teeman avaimen nykyisen värin ja valitun moodin perusteella
    let newTheme: ThemeKey
    if (selectedColor === "green") {
      newTheme = mode === "dark" ? "dark" : "light"
    } else if (selectedColor === "blue") {
      newTheme = mode === "dark" ? "blue" : "lightBlue"
    } else {
      newTheme = mode === "dark" ? "purple" : "lightPurple"
    }
    handleThemeSelect(newTheme)
  }

  const colorOptions: { value: "green" | "blue" | "purple"; label: string; color: string; }[] = [
    {
      value: "green",
      label: "Vihreä",
      color: "#4CAF50",
    },
    {
      value: "blue",
      label: "Sininen",
      color: "#2196F3",
    },
    {
      value: "purple",
      label: "Violetti",
      color: "#9C27B0",
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
        {/* Moodin valinta */}
        <View style={styles.modeContainer}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Teeman tyyli
          </Text>
          <View style={styles.modeOptions}>
            <Pressable
              style={[
                styles.modeOption,
                { 
                  backgroundColor: themeMode === "dark" ? theme.colors.primaryContainer : theme.colors.surface,
                  borderColor: themeMode === "dark" ? theme.colors.primary : theme.colors.outline,
                  borderWidth: 1,
                }
              ]}
              onPress={() => handleModeChange("dark")}
            >
              <RadioButton
                value="dark"
                status={themeMode === "dark" ? "checked" : "unchecked"}
                onPress={() => handleModeChange("dark")}
              />
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                Tumma
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeOption,
                { 
                  backgroundColor: themeMode === "light" ? theme.colors.primaryContainer : theme.colors.surface,
                  borderColor: themeMode === "light" ? theme.colors.primary : theme.colors.outline,
                  borderWidth: 1,
                }
              ]}
              onPress={() => handleModeChange("light")}
            >
              <RadioButton
                value="light"
                status={themeMode === "light" ? "checked" : "unchecked"}
                onPress={() => handleModeChange("light")}
              />
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                Vaalea
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Väriteeman valinta */}
        <View style={styles.colorContainer}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Väriteema
          </Text>
          <View style={styles.optionsContainer}>
            {colorOptions.map((option) => {
              const themeKey: ThemeKey = option.value === "green" 
                ? (themeMode === "dark" ? "dark" : "light")
                : option.value === "blue"
                ? (themeMode === "dark" ? "blue" : "lightBlue")
                : (themeMode === "dark" ? "purple" : "lightPurple")
              
              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.themeOption,
                    { 
                      backgroundColor: theme.colors.surface,
                      borderColor: selectedColor === option.value ? theme.colors.primary : theme.colors.outline,
                      borderWidth: selectedColor === option.value ? 2 : 1,
                    }
                  ]}
                  onPress={() => handleColorChange(option.value)}
                >
                  <View style={styles.themeInfo}>
                    <View style={styles.colorPreview}>
                      <View 
                        style={[
                          styles.colorSwatch, 
                          { backgroundColor: themes[themeKey].colors.background }
                        ]} 
                      />
                      <View 
                        style={[
                          styles.colorSwatch, 
                          { backgroundColor: themes[themeKey].colors.primary }
                        ]} 
                      />
                      <View 
                        style={[
                          styles.colorSwatch, 
                          { backgroundColor: themes[themeKey].colors.primaryContainer }
                        ]} 
                      />
                    </View>
                    <View style={styles.themeText}>
                      <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                        {option.label}
                      </Text>
                    </View>
                  </View>
                  <RadioButton
                    value={option.value}
                    status={selectedColor === option.value ? "checked" : "unchecked"}
                    onPress={() => handleColorChange(option.value)}
                  />
                </Pressable>
              )
            })}
          </View>
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
  sectionTitle: {
    marginBottom: 12,
  },
  modeContainer: {
    marginBottom: 32,
  },
  modeOptions: {
    flexDirection: "row",
    gap: 12,
  },
  modeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  colorContainer: {
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
