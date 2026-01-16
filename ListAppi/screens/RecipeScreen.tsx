import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import ScreenLayout from '../components/ScreenLayout';
import RecipeModal from '../components/RecipeModal';

interface RecipeScreenProps {
  activeScreen: string
  onNavigate: (screen: string) => void
}

const RecipeScreen: React.FC<RecipeScreenProps> = ({ activeScreen, onNavigate }) => {
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);

  return (
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate}>
      <Text variant="headlineMedium">Reseptit</Text>
      <Text variant="bodyMedium" style={styles.description}>
        Selaa ja hallinnoi reseptejä.
      </Text>

      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={() => setRecipeModalVisible(true)}>
          Lisää uusi resepti
        </Button>
      </View>

      <RecipeModal
        visible={recipeModalVisible}
        onClose={() => setRecipeModalVisible(false)}
        onSave={(recipe) => {
          console.log('Tallennettu resepti:', recipe);
        }}
      />
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  description: {
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 16,
  },
});

export default RecipeScreen
