import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";
import { ModalBase } from "../components/ModalBase";
import { SubmitButton } from "../components/SubmitButton";

interface RecipeModalProps {
    visible: boolean;
    onClose: () => void;
    onSave?: (recipe: CreateRecipeFormData) => void;
}

export interface CreateRecipeFormData {
    title: string;
    ingredients: string;
    instructions: string;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ visible, onClose, onSave }) => {
    const [title, setTitle] = useState("");
    const [ingredients, setIngredients] = useState("");
    const [instructions, setInstructions] = useState("");

    const handleClose = () => {
        setTitle("");
        setIngredients("");
        setInstructions("");
        onClose();
    };

    const handleSave = () => {
        onSave?.({
            title,
            ingredients,
            instructions,
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
});