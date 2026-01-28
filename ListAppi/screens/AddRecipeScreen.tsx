import React, { useState } from "react";
import { ScrollView, StyleSheet, View, Image, Pressable, Alert } from "react-native";
import { useTheme, Text } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import ScreenLayout from "../components/ScreenLayout";
import { SubmitButton } from "../components/SubmitButton";
import { ActionModal } from "../components/ActionModal";
import { Input } from "../components/Input";
import { FilterChip } from "../components/FilterChip";
import { DietType, MainIngredient, MealType } from "../types/RecipeMeta";
import {
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
  MAIN_INGREDIENTS,
  MAIN_INGREDIENT_LABELS,
  DIET_TYPES,
  DIET_TYPE_LABELS,
} from "../types/filterConstants";
import type { CreateRecipeFormData } from "../components/RecipeModal";
import { convertImageToBase64 } from "../firebase/imageUtils";

interface AddRecipeScreenProps {
  activeScreen: string;
  onNavigate: (screen: string, data?: any) => void;
  onSave?: (recipe: CreateRecipeFormData) => void;
  onBack: () => void;
  collectionId?: string | null;
  editRecipe?: {
    id: string;
    title: string;
    link?: string;
    ingredients: string;
    instructions: string;
    mealType: MealType;
    mainIngredient: MainIngredient;
    dietType: DietType[];
    image?: string;
  };
}

const AddRecipeScreen: React.FC<AddRecipeScreenProps> = ({ activeScreen, onNavigate, onSave, onBack, editRecipe }) => {
    const theme = useTheme();
    const [title, setTitle] = useState(editRecipe?.title ?? "");
    const [link, setLink] = useState(editRecipe?.link ?? "");
    const [ingredients, setIngredients] = useState(editRecipe?.ingredients ?? "");
    const [instructions, setInstructions] = useState(editRecipe?.instructions ?? "");
    const [mealType, setMealType] = useState<MealType | null>(editRecipe?.mealType ?? null);
    const [mainIngredient, setMainIngredient] = useState<MainIngredient | null>(editRecipe?.mainIngredient ?? null);
    const [dietType, setDietType] = useState<DietType[]>(editRecipe?.dietType ?? []);
    const [recipeImage, setRecipeImage] = useState<string | null>(editRecipe?.image ?? null);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isEditMode = !!editRecipe;

    const toggleDietType = (tag: DietType) => {
        setDietType((prevTypes) =>
            prevTypes.includes(tag) ? prevTypes.filter((type) => type !== tag) : [...prevTypes, tag]
        );
    };

    const pickImage = async () => {
        setShowImagePicker(true);
    };

    const pickFromGallery = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Oikeudet vaaditaan', 'Tarvitsemme pääsynkuvakirjastoon');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setRecipeImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Virhe', 'Kuvan valinnassa tapahtui virhe');
        }
    };

    const takeWithCamera = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Oikeudet vaaditaan', 'Tarvitsemme pääsyyn kameraan');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setRecipeImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Virhe', 'Kameran käytössä tapahtui virhe');
        }
    };

    const getValidationErrors = () => {
        const errors: string[] = [];
        if (!title.trim()) errors.push("Reseptin nimi on pakollinen");
        if (!mealType) errors.push("Ruokalaji on pakollinen");
        if (!mainIngredient) errors.push("Pääraaka-aine on pakollinen");
        return errors;
    };

    const validationErrors = getValidationErrors();
    const isValid = validationErrors.length === 0;

    const handleBack = () => {
        onBack();
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const formData: CreateRecipeFormData = {
                title,
                ingredients,
                instructions,
                mealType,
                mainIngredient,
                dietType,
            };
            
            if (link.trim()) {
                formData.link = link;
            }

            if (recipeImage) {
                try {
                    // Käännä kuva base64-muotoon ennen tallennusta
                    formData.image = await convertImageToBase64(recipeImage);
                    console.log('Image converted successfully');
                } catch (error) {
                    Alert.alert('Virhe', 'Kuvan käsittelyssä tapahtui virhe');
                    console.error('Error converting image:', error);
                    setIsSaving(false);
                    return;
                }
            }
            
            await onSave?.(formData);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScreenLayout
            activeScreen={activeScreen}
            onNavigate={onNavigate}
            customTitle={isEditMode ? "Muokkaa reseptiä" : "Lisää uusi resepti"}
            showBack={true}
            onBack={handleBack}
            showNav={false}
        >
            <ScrollView style={styles.container}>
            <Input
                label="Reseptin nimi *"
                value={title}
                onChangeText={setTitle}
            />
            <Input
                label="Linkki reseptiin"
                value={link}
                onChangeText={setLink}
            />
                <Text variant="titleSmall" style={styles.sectionTitle}>Ruokalaji *</Text>
                <View style={styles.chipRow}>
                  {MEAL_TYPES.map((meal) => (
                    <FilterChip
                      key={meal}
                      label={MEAL_TYPE_LABELS[meal]}
                      selected={mealType === meal}
                      onPress={() => setMealType(meal)}
                    />
                  ))}
                </View>
                <Text variant="titleSmall" style={styles.sectionTitle}>Pääraaka-aine *</Text>
                <View style={styles.chipRow}>
                  {MAIN_INGREDIENTS.map((ingredient) => (
                    <FilterChip
                      key={ingredient}
                      label={MAIN_INGREDIENT_LABELS[ingredient]}
                      selected={mainIngredient === ingredient}
                      onPress={() => setMainIngredient(ingredient)}
                    />
                  ))}
                </View>
                <Text variant="titleSmall" style={styles.sectionTitle}>Ruokavaliot</Text>
                <View style={styles.chipRow}>
                  {DIET_TYPES.map((diet) => (
                    <FilterChip
                      key={diet}
                      label={DIET_TYPE_LABELS[diet]}
                      selected={dietType.includes(diet)}
                      onPress={() => toggleDietType(diet)}
                    />
                  ))}
                </View>
                <Input
                    label="Ainekset"
                    value={ingredients}
                    onChangeText={setIngredients}
                    multiline
                    numberOfLines={50}
                    minHeight={200}
                />
                <Input
                    label="Ohjeet"
                    value={instructions}
                    onChangeText={setInstructions}
                    multiline
                    numberOfLines={100}
                    minHeight={200}
                />
                {!recipeImage && (
                    <Pressable onPress={pickImage} style={[styles.addImageButton, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Text style={styles.addImageText}>+ Lisää kuva reseptiin</Text>
                    </Pressable>
                )}
                {recipeImage && (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: recipeImage }} style={styles.recipeImage} />
                        <Pressable onPress={() => setRecipeImage(null)} style={styles.removeImageButton}>
                            <Text style={styles.removeImageText}>Poista kuva</Text>
                        </Pressable>
                    </View>
                )}
                <SubmitButton
                    text={isEditMode ? "Tallenna muutokset" : "Tallenna resepti"}
                    onPress={handleSave}
                    disabled={!isValid || isSaving}
                />
                {!isValid && (
                    <Text style={styles.errorText}>
                        Täytä * merkityt kentät
                    </Text>
                )}
                <View style={{ height: 60 }} />
            </ScrollView>
            <ActionModal
                visible={showImagePicker}
                onClose={() => setShowImagePicker(false)}
                title="Valitse kuva"
                actionIds={['camera', 'gallery']}
                onCamera={takeWithCamera}
                onGallery={pickFromGallery}
            />
        </ScreenLayout>
    );
};

export default AddRecipeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
    },
    input: {
        marginBottom: 16,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        marginBottom: 8,
    },
    errorText: {
        color: '#d32f2f',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    addImageButton: {
        padding: 12,
        marginBottom: 16,
        borderWidth: 0,
        borderRadius: 8,
        alignItems: 'center',
    },
    addImageText: {
        color: 'black',
        fontSize: 16,
        fontWeight: '500',
    },
    imageContainer: {
        marginBottom: 16,
        alignItems: 'center',
    },
    recipeImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
    },
    removeImageButton: {
        padding: 8,
        backgroundColor: '#d32f2f',
        borderRadius: 6,
    },
    removeImageText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
});
