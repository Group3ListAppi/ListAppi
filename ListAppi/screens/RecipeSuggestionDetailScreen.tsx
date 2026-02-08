import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View, ScrollView, Image, Linking } from "react-native";
import { Text, Divider, useTheme, Button, ActivityIndicator } from "react-native-paper";
import ScreenLayout from "../components/ScreenLayout";
import { AdBanner } from "../components/AdBanner";
import { mealDbToCreateRecipeForm } from "../utils/themealdbImport";

type MealDbLookupMeal = {
  idMeal: string;
  strMeal: string;
  strMealThumb?: string;
  strInstructions?: string;
  strSource?: string;
  strYoutube?: string;
  // ja paljon muita kenttiä...
  [key: string]: any;
};

interface Props {
  activeScreen: string;
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
  isPremium?: boolean;

  // tämä tulee HomeScreeniltä:
  idMeal: string;
}

const RecipeSuggestionDetailScreen: React.FC<Props> = ({
  activeScreen,
  onNavigate,
  onBack,
  isPremium,
  idMeal,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [meal, setMeal] = useState<MealDbLookupMeal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      setImageError(false);

      try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`);
        if (!res.ok) throw new Error(`TheMealDB lookup failed: ${res.status}`);
        const json = await res.json();
        const m = (json?.meals?.[0] as MealDbLookupMeal | undefined) ?? null;

        if (alive) setMeal(m);
        if (alive && !m) setError("Reseptiä ei löytynyt.");
      } catch (e) {
        console.error(e);
        if (alive) setError("Reseptin lataus epäonnistui.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [idMeal]);

  const ingredientsText = useMemo(() => {
    if (!meal) return "";
    const lines: string[] = [];

    for (let i = 1; i <= 20; i++) {
      const ing = String(meal[`strIngredient${i}`] ?? "").trim();
      const meas = String(meal[`strMeasure${i}`] ?? "").trim();
      if (!ing) continue;

      const line = meas ? `${meas} ${ing}`.trim() : ing;
      lines.push(`• ${line}`);
    }
    return lines.join("\n");
  }, [meal]);

  const title = meal?.strMeal ?? "Resepti";

  const primaryLink = meal?.strSource?.trim() || meal?.strYoutube?.trim() || "";

  return (
    <ScreenLayout
      activeScreen={activeScreen}
      onNavigate={onNavigate}
      showNav={false}
      showBack={true}
      onBack={onBack}
      hideActions={true}
      customTitle={title}
    >
      <>
        <ScrollView style={styles.container}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator animating size="large" />
            </View>
          ) : error ? (
            <Text style={{ color: theme.colors.error }}>{error}</Text>
          ) : meal ? (
            <>
              {primaryLink ? (
                <>
                  <Button
                    mode="contained"
                    onPress={() => Linking.openURL(primaryLink)}
                    style={styles.linkButton}
                  >
                    Avaa lähde
                  </Button>
                  <Divider style={styles.divider} />
                </>
              ) : null}

              {meal.strMealThumb && !imageError ? (
                <>
                  <Image
                    source={{ uri: meal.strMealThumb }}
                    style={styles.recipeImage}
                    onError={() => setImageError(true)}
                  />
                  <Divider style={styles.divider} />
                </>
              ) : null}

              {meal.strMealThumb && imageError ? (
                <>
                  <View
                    style={[
                      styles.recipeImage,
                      {
                        backgroundColor: theme.colors.surfaceVariant,
                        justifyContent: "center",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>Kuva ei saatavilla</Text>
                  </View>
                  <Divider style={styles.divider} />
                </>
              ) : null}

              {ingredientsText ? (
                <>
                  <Text variant="titleSmall" style={styles.sectionTitle}>
                    Ainekset
                  </Text>
                  <Text variant="bodyMedium" style={styles.content}>
                    {ingredientsText}
                  </Text>
                  <Divider style={styles.divider} />
                </>
              ) : null}

              {meal.strInstructions?.trim() ? (
                <>
                  <Text variant="titleSmall" style={styles.sectionTitle}>
                    Ohjeet
                  </Text>
                  <Text variant="bodyMedium" style={styles.content}>
                    {meal.strInstructions.trim()}
                  </Text>
                  <Divider style={styles.divider} />
                </>
              ) : null}

              {/*Tallenna omiin resepteihin -nappi */}
              <Button
                mode="outlined"
                icon="plus"
                onPress={() => onNavigate("add-recipe", {
                    prefillRecipe: mealDbToCreateRecipeForm(meal)
                })}
                >
                Tallenna omiin resepteihin
                </Button>

              <View style={{ height: 200 }} />
            </>
          ) : null}
        </ScrollView>

        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <AdBanner onPress={() => onNavigate("premium")} isPremium={isPremium} />
        </View>
      </>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  center: {
    paddingTop: 40,
    alignItems: "center",
  },
  linkButton: {
    marginBottom: 12,
  },
  recipeImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  content: {
    marginBottom: 8,
    lineHeight: 20,
  },
  divider: {
    marginVertical: 12,
  },
});

export default RecipeSuggestionDetailScreen;