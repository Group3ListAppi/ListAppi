import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, View, Image } from "react-native";
import { ActivityIndicator, useTheme } from "react-native-paper";
import { ListButton } from "../components/ListButton";
import ScreenLayout from "../components/ScreenLayout";
import { useAuth } from "../auth/useAuth";
import { getUserRecipeCollections, moveRecipesToCollection, addRecipeToCollection } from "../firebase/recipeCollectionUtils";
import type { RecipeCollection } from "../firebase/recipeCollectionUtils";

interface MoveRecipesToCollectionScreenProps {
  sourceCollectionId?: string;
  recipeIds: string[];
  activeScreen: string;
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
}

const MoveRecipesToCollectionScreen: React.FC<MoveRecipesToCollectionScreenProps> = ({
  sourceCollectionId,
  recipeIds,
  activeScreen,
  onNavigate,
  onBack,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [collections, setCollections] = useState<RecipeCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (activeScreen === "move-recipes-to-collection" && user?.uid) {
      loadCollections();
    }
  }, [activeScreen, user?.uid]);

  const loadCollections = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const userCollections = await getUserRecipeCollections(user.uid);
      // Filter out the source collection (if provided), show both owned and shared collections
      const availableCollections = userCollections.filter(
        (c) => !sourceCollectionId || c.id !== sourceCollectionId
      );
      setCollections(availableCollections);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCollection = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
  };

  const handleMoveRecipes = async () => {
    if (!selectedCollectionId || moving) return;
    try {
      setMoving(true);
      if (sourceCollectionId) {
        // Moving from a collection
        await moveRecipesToCollection(sourceCollectionId, selectedCollectionId, recipeIds);
      } else {
        // Adding to a collection (no source collection)
        for (const recipeId of recipeIds) {
          await addRecipeToCollection(selectedCollectionId, recipeId);
        }
      }
      onBack();
    } catch (error) {
      console.error('Error moving recipes:', error);
    } finally {
      setMoving(false);
    }
  };

  return (
    <ScreenLayout
      activeScreen={activeScreen}
      onNavigate={onNavigate}
      showNav={false}
      showBack={true}
      onBack={onBack}
      customTitle={sourceCollectionId ? "Siirrä reseptit" : "Lisää kokoelmaan"}
      showFAB={selectedCollectionId !== null}
      onFABPress={handleMoveRecipes}
      fabLabel={moving ? (sourceCollectionId ? "Siirretään..." : "Lisätään...") : (sourceCollectionId ? "Siirrä" : "Lisää")}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" />
        </View>
      ) : collections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={require('../assets/PikkuKokki.png')}
            style={styles.emptyImage}
            resizeMode="contain"
          />
        </View>
      ) : (
        <ScrollView style={styles.container}>
          {collections.map((collection) => (
            <ListButton
              key={collection.id}
              listName={collection.name}
              ownerAvatar={user?.photoURL || undefined}
              ownerInitials={user?.displayName?.charAt(0).toUpperCase() || "?"}
              ownerName={user?.displayName}
              isOwnedByUser={true}
              onPress={() => handleSelectCollection(collection.id)}
              showRadioButton={true}
              isRadioSelected={selectedCollectionId === collection.id}
              disableSwipe={true}
            />
          ))}
        </ScrollView>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImage: {
    width: 300,
    height: 300,
  },
  container: {
    flex: 1,
  },
});

export default MoveRecipesToCollectionScreen;
