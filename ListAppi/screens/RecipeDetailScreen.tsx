import React, { useState } from 'react'
import { StyleSheet, View, ScrollView, Linking, Image } from 'react-native'
import { Text, Divider, useTheme, Chip, Button } from 'react-native-paper'
import AppBar from '../components/AppBar'
import type { CreateRecipeFormData } from '../components/RecipeModal'
import ScreenLayout from '../components/ScreenLayout'
import { AdBanner } from '../components/AdBanner'

interface Recipe extends CreateRecipeFormData {
  id: string
  link?: string
}

interface RecipeDetailScreenProps {
  recipe: Recipe
  activeScreen: string
  onNavigate: (screen: string) => void
  onBack: () => void
}

const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({
  recipe,
  activeScreen,
  onNavigate,
  onBack,
  isPremium,
}) => {
  const theme = useTheme()
  const [imageError, setImageError] = useState(false)

  return (
    <ScreenLayout 
      activeScreen={activeScreen} 
      onNavigate={onNavigate} 
      showNav={false}
      showBack={true}
      onBack={onBack}
      hideActions={true}
      customTitle={recipe.title}
    >
      <>
        <ScrollView style={styles.container}>
        {recipe.link && (
          <>
            <Button
              mode="contained"
              onPress={() => Linking.openURL(recipe.link!)}
              style={styles.linkButton}
            >
              Avaa resepti linkistä
            </Button>
            <Divider style={styles.divider} />
          </>
        )}

        {recipe.image && !imageError && (
          <>
            <Image 
              source={{ uri: recipe.image }} 
              style={styles.recipeImage}
              onError={() => {
                console.warn('Image failed to load:', recipe.image?.substring(0, 50));
                setImageError(true);
              }}
            />
            <Divider style={styles.divider} />
          </>
        )}

        {recipe.image && imageError && (
          <>
            <View style={[styles.recipeImage, { backgroundColor: theme.colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Kuva ei saatavilla
              </Text>
            </View>
            <Divider style={styles.divider} />
          </>
        )}

        {recipe.ingredients && recipe.ingredients.trim() && (
          <>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Ainekset
            </Text>
            <Text variant="bodyMedium" style={styles.content}>
              {recipe.ingredients}
            </Text>
            <Divider style={styles.divider} />
          </>
        )}

        {recipe.instructions && recipe.instructions.trim() && (
          <>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Ohjeet
            </Text>
            <Text variant="bodyMedium" style={styles.content}>
              {recipe.instructions}
            </Text>
            <Divider style={styles.divider} />
          </>
        )}

        <View style={styles.tagsContainer}>
          {recipe.mealType && (
            <Chip
              icon="check"
              style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
              textStyle={{ color: 'black' }}
            >
              {recipe.mealType}
            </Chip>
          )}

          {recipe.mainIngredient && (
            <Chip
              icon="check"
              style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
              textStyle={{ color: 'black' }}
            >
              {recipe.mainIngredient}
            </Chip>
          )}

          {recipe.dietType && recipe.dietType.length > 0 && recipe.dietType.map((diet) => (
            <Chip
              key={diet}
              icon="check"
              style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
              textStyle={{ color: 'black' }}
            >
              {diet}
            </Chip>
          ))}
        </View>
        <View style={{ height: 200 }} />
      </ScrollView>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <AdBanner onPress={() => onNavigate('premium')} isPremium={isPremium}/>
      </View>
      </>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  linkButton: {
    marginBottom: 12,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  content: {
    marginBottom: 8,
    lineHeight: 20,
  },
  divider: {
    marginVertical: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
  },
})

export default RecipeDetailScreen
