import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";
import { ModalBase } from "../components/ModalBase";
import { SubmitButton } from "../components/SubmitButton";
import { DietType, MainIngredient, MealType } from "../types/RecipeMeta";
import { Chip, Text } from "react-native-paper";
import { View } from "react-native";

interface RecipeModalProps {
    visible: boolean;
    onClose: () => void;
    onSave?: (recipe: CreateRecipeFormData) => void;
}

export interface CreateRecipeFormData {
    title: string;
    ingredients: string;
    instructions: string;
    mealType: MealType | null;
    mainIngredient: MainIngredient | null;
    dietType: DietType[];
}

const RecipeModal: React.FC<RecipeModalProps> = ({ visible, onClose, onSave }) => {
    const [title, setTitle] = useState("");
    const [ingredients, setIngredients] = useState("");
    const [instructions, setInstructions] = useState("");
    const [mealType, setMealType] = useState<MealType | null>(null);
    const [mainIngredient, setMainIngredient] = useState<MainIngredient | null>(null);
    const [dietType, setDietType] = useState<DietType[]>([]);

    const toggleDietType = (tag: DietType) => {
        setDietType((prevTypes) =>
            prevTypes.includes(tag) ? prevTypes.filter((type) => type !== tag) : [...prevTypes, tag]
        );
    };

    const handleClose = () => {
        setTitle("");
        setIngredients("");
        setInstructions("");
        setMealType(null);
        setMainIngredient(null);
        setDietType([]);
        onClose();
    };

    const handleSave = () => {
        onSave?.({
            title,
            ingredients,
            instructions,
            mealType,
            mainIngredient,
            dietType
        });
        handleClose();
    };

    return (
        <ModalBase visible={visible} title="Lisää uusi resepti" onClose={handleClose}>
            <ScrollView>
                <TextInput
                    label='Reseptin nimi'
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                />
                <Text variant="titleSmall" style={styles.sectionTitle}>Ruokalaji</Text>
                <View style={styles.chipRow}>
                    <Chip selected={mealType === 'aamupala'} onPress={() => setMealType('aamupala')}>Aamupala</Chip>
                    <Chip selected={mealType === 'lounas'} onPress={() => setMealType('lounas')}>Lounas</Chip>
                    <Chip selected={mealType === 'päivällinen'} onPress={() => setMealType('päivällinen')}>Päivällinen</Chip>
                    <Chip selected={mealType === 'välipala'} onPress={() => setMealType('välipala')}>Välipala</Chip>
                    <Chip selected={mealType === 'jälkiruoka'} onPress={() => setMealType('jälkiruoka')}>Jälkiruoka</Chip>
                    <Chip selected={mealType === 'alkupala'} onPress={() => setMealType('alkupala')}>Alkupala</Chip>
                    <Chip selected={mealType === 'juoma'} onPress={() => setMealType('juoma')}>Juoma</Chip>
                    <Chip selected={mealType === 'lisuke'} onPress={() => setMealType('lisuke')}>Lisuke</Chip>
                </View>
                <Text variant="titleSmall" style={styles.sectionTitle}>Pääraaka-aine</Text>
                <View style={styles.chipRow}>
                    <Chip selected={mainIngredient === 'kana'} onPress={() => setMainIngredient('kana')}>Kana</Chip>
                    <Chip selected={mainIngredient === 'liha'} onPress={() => setMainIngredient('liha')}>Liha</Chip>
                    <Chip selected={mainIngredient === 'kala'} onPress={() => setMainIngredient('kala')}>Kala</Chip>
                    <Chip selected={mainIngredient === 'kasvis'} onPress={() => setMainIngredient('kasvis')}>Kasvis</Chip>
                    <Chip selected={mainIngredient === 'pasta'} onPress={() => setMainIngredient('pasta')}>Pasta</Chip>
                    <Chip selected={mainIngredient === 'riisi'} onPress={() => setMainIngredient('riisi')}>Riisi</Chip>
                    <Chip selected={mainIngredient === 'muu'} onPress={() => setMainIngredient('muu')}>Muu</Chip>
                </View>
                <Text variant="titleSmall" style={styles.sectionTitle}>Ruokavaliot</Text>
                <View style={styles.chipRow}>
                    <Chip selected={dietType.includes('vegaaninen')} onPress={() => toggleDietType('vegaaninen')}>Vegaaninen</Chip>
                    <Chip selected={dietType.includes('laktoositon')} onPress={() => toggleDietType('laktoositon')}>Laktoositon</Chip>
                    <Chip selected={dietType.includes('gluteeniton')} onPress={() => toggleDietType('gluteeniton')}>Gluteeniton</Chip>
                    <Chip selected={dietType.includes('maidoton')} onPress={() => toggleDietType('maidoton')}>Maidoton</Chip>
                    <Chip selected={dietType.includes('kasvisruoka')} onPress={() => toggleDietType('kasvisruoka')}>Kasvisruoka</Chip>
                    <Chip onPress={() => setDietType([])}>Tyhjennä</Chip>
                </View>
                <TextInput
                    label='Ainekset'
                    placeholder='Yksi aines per rivi'
                    value={ingredients}
                    onChangeText={setIngredients}
                    multiline
                    numberOfLines={10}
                    style={styles.input}
                />
                <TextInput
                    label='Ohjeet'
                    value={instructions}
                    onChangeText={setInstructions}
                    multiline
                    numberOfLines={20}
                    style={styles.input}
                    />
                    <SubmitButton
                        text="Tallenna resepti"
                        onPress={handleSave}
                        disabled={!title.trim() || !ingredients.trim() || !instructions.trim()}
                    />
            </ScrollView>
        </ModalBase>
    );
};

export default RecipeModal;

const styles = StyleSheet.create({
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
});