import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { ModalBase } from "../components/ModalBase";
import { SubmitButton } from "../components/SubmitButton";
import { Input } from "./Input";

export type ListType = "menu" | "shopping";

interface ListModalProps {
    visible: boolean;
    type: ListType;
    onClose: () => void;
    onSave?: (list: CreateListFormData) => void;
}

export interface CreateListFormData {
    name: string;
    type: ListType;
}

const ListModal: React.FC<ListModalProps> = ({
    visible,
    type,
    onClose,
    onSave,
}) => {
    const [name, setName] = useState("");

    const title = type === "menu" ? "Uusi ruokalista" : "Uusi ostoslista";

    const handleClose = () => {
        setName("");
        onClose();
    };

    const handleSave = () => {
        onSave?.({
            name,
            type,
        });
        handleClose();
    };

    return (
        <ModalBase visible={visible} title={title} onClose={handleClose}>
            <ScrollView>
                <Input
                    label="Listan nimi"
                    value={name}
                    onChangeText={setName}
                />
                <SubmitButton
                    text="Tallenna"
                    onPress={handleSave}
                    disabled={!name.trim()}
                />
            </ScrollView>
        </ModalBase>
    );
};

export default ListModal;