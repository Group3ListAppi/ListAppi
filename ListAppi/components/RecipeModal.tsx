import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { ModalBase } from "../components/ModalBase";
import { SubmitButton } from "../components/SubmitButton";
import { DietType, MainIngredient, MealType } from "../types/RecipeMeta";
import { Chip, Text } from "react-native-paper";

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
    link?: string;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ visible, onClose, onSave }) => {
    const theme = useTheme();
    const [title, setTitle] = useState("");
    const [link, setLink] = useState("");
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

    const getValidationErrors = () => {
        const errors: string[] = [];
        if (!title.trim()) errors.push("Reseptin nimi on pakollinen");
        if (!mealType) errors.push("Ruokalaji on pakollinen");
        if (!mainIngredient) errors.push("Pääraaka-aine on pakollinen");
        return errors;
    };

    const validationErrors = getValidationErrors();
    const isValid = validationErrors.length === 0;

    const handleClose = () => {
        setTitle("");
        setLink("");
        setIngredients("");
        setInstructions("");
        setMealType(null);
        setMainIngredient(null);
        setDietType([]);
        onClose();
    };

    const handleSave = () => {
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
        
        onSave?.(formData);
        handleClose();
    };

    return (
        <ModalBase visible={visible} title="Lisää uusi resepti" onClose={handleClose}>
            <ScrollView>
                <TextInput
                    label="Reseptin nimi *"
                    value={title}
                    onChangeText={setTitle}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={theme.colors.primaryContainer}
                    activeOutlineColor={theme.colors.primaryContainer}
                />
                <TextInput
                    label="Linkki reseptiin"
                    onChangeText={setLink}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={theme.colors.primaryContainer}
                    activeOutlineColor={theme.colors.primaryContainer}
                />
                <Text variant="titleSmall" style={styles.sectionTitle}>Ruokalaji *</Text>
                <View style={styles.chipRow}>
                    <Chip selected={mealType === 'airfryer-ruoat'} onPress={() => setMealType('airfryer-ruoat')} selectedColor='black' style={mealType === 'airfryer-ruoat' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mealType === 'airfryer-ruoat' ? { color: 'black' } : { color: '#FFFFFF' }}>Airfryer-ruoat</Chip>
                    <Chip selected={mealType === 'keitot'} onPress={() => setMealType('keitot')} selectedColor='black' style={mealType === 'keitot' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mealType === 'keitot' ? { color: 'black' } : { color: '#FFFFFF' }}>Keitot</Chip>
                    <Chip selected={mealType === 'salaatit'} onPress={() => setMealType('salaatit')} selectedColor='black' style={mealType === 'salaatit' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mealType === 'salaatit' ? { color: 'black' } : { color: '#FFFFFF' }}>Salaatit</Chip>
                    <Chip selected={mealType === 'pastat'} onPress={() => setMealType('pastat')} selectedColor='black' style={mealType === 'pastat' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mealType === 'pastat' ? { color: 'black' } : { color: '#FFFFFF' }}>Pastat</Chip>
                    <Chip selected={mealType === 'hampurilaiset'} onPress={() => setMealType('hampurilaiset')} selectedColor='black' style={mealType === 'hampurilaiset' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mealType === 'hampurilaiset' ? { color: 'black' } : { color: '#FFFFFF' }}>Hampurilaiset</Chip>
                    <Chip selected={mealType === 'pihvit'} onPress={() => setMealType('pihvit')} selectedColor='black' style={mealType === 'pihvit' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mealType === 'pihvit' ? { color: 'black' } : { color: '#FFFFFF' }}>Pihvit</Chip>
                    <Chip selected={mealType === 'uuniruoat'} onPress={() => setMealType('uuniruoat')} selectedColor='black' style={mealType === 'uuniruoat' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mealType === 'uuniruoat' ? { color: 'black' } : { color: '#FFFFFF' }}>Uuniruoat</Chip>
                    <Chip selected={mealType === 'pataruoat'} onPress={() => setMealType('pataruoat')} selectedColor='black' style={mealType === 'pataruoat' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mealType === 'pataruoat' ? { color: 'black' } : { color: '#FFFFFF' }}>Pataruoat</Chip>
                    <Chip selected={mealType === 'tacot ja tortillat'} onPress={() => setMealType('tacot ja tortillat')} selectedColor='black' style={mealType === 'tacot ja tortillat' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mealType === 'tacot ja tortillat' ? { color: 'black' } : { color: '#FFFFFF' }}>Tacot ja tortillat</Chip>
                    <Chip selected={mealType === 'muu'} onPress={() => setMealType('muu')} selectedColor='black' style={mealType === 'muu' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mealType === 'muu' ? { color: 'black' } : { color: '#FFFFFF' }}>Muu</Chip>

                </View>
                <Text variant="titleSmall" style={styles.sectionTitle}>Pääraaka-aine *</Text>
                <View style={styles.chipRow}>
                    <Chip selected={mainIngredient === 'liha'} onPress={() => setMainIngredient('liha')} selectedColor='black' style={mainIngredient === 'liha' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mainIngredient === 'liha' ? { color: 'black' } : { color: '#FFFFFF' }}>Liha</Chip>
                    <Chip selected={mainIngredient === 'jauheliha'} onPress={() => setMainIngredient('jauheliha')} selectedColor='black' style={mainIngredient === 'jauheliha' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mainIngredient === 'jauheliha' ? { color: 'black' } : { color: '#FFFFFF' }}>Jauheliha</Chip>
                    <Chip selected={mainIngredient === 'makkara'} onPress={() => setMainIngredient('makkara')} selectedColor='black' style={mainIngredient === 'makkara' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mainIngredient === 'makkara' ? { color: 'black' } : { color: '#FFFFFF' }}>Makkara</Chip>
                    <Chip selected={mainIngredient === 'broileri'} onPress={() => setMainIngredient('broileri')} selectedColor='black' style={mainIngredient === 'broileri' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mainIngredient === 'broileri' ? { color: 'black' } : { color: '#FFFFFF' }}>Broileri</Chip>
                    <Chip selected={mainIngredient === 'kala'} onPress={() => setMainIngredient('kala')} selectedColor='black' style={mainIngredient === 'kala' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mainIngredient === 'kala' ? { color: 'black' } : { color: '#FFFFFF' }}>Kala</Chip>
                    <Chip selected={mainIngredient === 'äyriäiset'} onPress={() => setMainIngredient('äyriäiset')} selectedColor='black' style={mainIngredient === 'äyriäiset' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mainIngredient === 'äyriäiset' ? { color: 'black' } : { color: '#FFFFFF' }}>Äyriäiset</Chip>
                    <Chip selected={mainIngredient === 'kananmuna'} onPress={() => setMainIngredient('kananmuna')} selectedColor='black' style={mainIngredient === 'kananmuna' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mainIngredient === 'kananmuna' ? { color: 'black' } : { color: '#FFFFFF' }}>Kananmuna</Chip>
                    <Chip selected={mainIngredient === 'kasvis'} onPress={() => setMainIngredient('kasvis')} selectedColor='black' style={mainIngredient === 'kasvis' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mainIngredient === 'kasvis' ? { color: 'black' } : { color: '#FFFFFF' }}>Kasvis</Chip>
                    <Chip selected={mainIngredient === 'kasviproteiini'} onPress={() => setMainIngredient('kasviproteiini')} selectedColor='black' style={mainIngredient === 'kasviproteiini' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mainIngredient === 'kasviproteiini' ? { color: 'black' } : { color: '#FFFFFF' }}>Kasviproteiini</Chip>
                    <Chip selected={mainIngredient === 'muu'} onPress={() => setMainIngredient('muu')} selectedColor='black' style={mainIngredient === 'muu' ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={mainIngredient === 'muu' ? { color: 'black' } : { color: '#FFFFFF' }}>Muu</Chip>
                </View>
                <Text variant="titleSmall" style={styles.sectionTitle}>Ruokavaliot</Text>
                <View style={styles.chipRow}>
                    <Chip selected={dietType.includes('gluteeniton')} onPress={() => toggleDietType('gluteeniton')} selectedColor='black' style={dietType.includes('gluteeniton') ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={dietType.includes('gluteeniton') ? { color: 'black' } : { color: '#FFFFFF' }}>Gluteeniton</Chip>
                    <Chip selected={dietType.includes('kananmunaton')} onPress={() => toggleDietType('kananmunaton')} selectedColor='black' style={dietType.includes('kananmunaton') ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={dietType.includes('kananmunaton') ? { color: 'black' } : { color: '#FFFFFF' }}>Kananmunaton</Chip>
                    <Chip selected={dietType.includes('kasvis')} onPress={() => toggleDietType('kasvis')} selectedColor='black' style={dietType.includes('kasvis') ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={dietType.includes('kasvis') ? { color: 'black' } : { color: '#FFFFFF' }}>Kasvis</Chip>
                    <Chip selected={dietType.includes('laktoositon')} onPress={() => toggleDietType('laktoositon')} selectedColor='black' style={dietType.includes('laktoositon') ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={dietType.includes('laktoositon') ? { color: 'black' } : { color: '#FFFFFF' }}>Laktoositon</Chip>
                    <Chip selected={dietType.includes('maidoton')} onPress={() => toggleDietType('maidoton')} selectedColor='black' style={dietType.includes('maidoton') ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={dietType.includes('maidoton') ? { color: 'black' } : { color: '#FFFFFF' }}>Maidoton</Chip>
                    <Chip selected={dietType.includes('vegaaninen')} onPress={() => toggleDietType('vegaaninen')} selectedColor='black' style={dietType.includes('vegaaninen') ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primaryContainer }} textStyle={dietType.includes('vegaaninen') ? { color: 'black' } : { color: '#FFFFFF' }}>Vegaaminen</Chip>
                </View>
                <Text variant="titleSmall" style={styles.sectionTitle}>Ainekset</Text>
                <TextInput
                    value={ingredients}
                    onChangeText={setIngredients}
                    multiline
                    numberOfLines={15}
                    style={[styles.input, { backgroundColor: 'white', color: 'black', minHeight: 200 }]}
                    textColor='black'
                    activeOutlineColor={theme.colors.primary}
                />
                <Text variant="titleSmall" style={styles.sectionTitle}>Ohjeet</Text>
                <TextInput
                    value={instructions}
                    onChangeText={setInstructions}
                    multiline
                    numberOfLines={30}
                    style={[styles.input, { backgroundColor: 'white', color: 'black', minHeight: 200 }]}
                    textColor='black'
                    activeOutlineColor={theme.colors.primary}
                    />
                    <SubmitButton
                        text="Tallenna resepti"
                        onPress={handleSave}
                        disabled={!isValid}
                    />
                    {!isValid && (
                        <Text style={styles.errorText}>
                            Täytä * merkityt kentät
                        </Text>
                    )}
                    <View style={{ height: 60 }} />
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
    errorText: {
        color: '#d32f2f',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});