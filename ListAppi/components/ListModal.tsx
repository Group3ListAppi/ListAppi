import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { ModalBase } from "../components/ModalBase";
import { SubmitButton } from "../components/SubmitButton";
import { Input } from "./Input";

export type ListType = "menu" | "shopping" | "recipe-collection";

interface ListModalProps {
    visible: boolean;
    type: ListType;
    onClose: () => void;
    onSave?: (list: CreateListFormData) => void;
    initialName?: string;
    title?: string;
    saveLabel?: string;
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
    initialName,
    title,
    saveLabel = "Tallenna",
}) => {
    const [name, setName] = useState("");

    const defaultTitle = type === "menu" ? "Uusi ruokalista" : type === "recipe-collection" ? "Uusi kokoelma" : "Uusi ostoslista";
    const inputLabel = type === "recipe-collection" ? "Kokoelman nimi" : "Listan nimi";

    useEffect(() => {
        if (visible) {
            setName(initialName ?? "");
        }
    }, [visible, initialName, type]);

    const handleClose = () => {
        setName("");
        onClose();
    };

    const handleSave = () => {
        onSave?.({
            name: name.trim(),
            type,
        });
        handleClose();
    };

    return (
        <ModalBase visible={visible} title={title || defaultTitle} onClose={handleClose}>
            <ScrollView>
                <Input
                    label={inputLabel}
                    value={name}
                    onChangeText={setName}
                />
                <SubmitButton
                    text={saveLabel}
                    onPress={handleSave}
                    disabled={!name.trim()}
                />
            </ScrollView>
        </ModalBase>
    );
};

export default ListModal;