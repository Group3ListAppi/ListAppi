import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Text, useTheme } from "react-native-paper";
import AppBar from "../components/AppBar";
import type { MenuList } from "../firebase/menuUtils";

interface MenuDetailScreenProps {
    menuList: MenuList;
    activeScreen: string;
    onNavigate: (screen: string, data?: any) => void;
    onBack: () => void;
}

const MenuDetailScreen: React.FC<MenuDetailScreenProps> = ({
    menuList,
    activeScreen,
    onNavigate,
    onBack,
}) => {
    const theme = useTheme();

    return (
        <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
            <AppBar
                title={menuList.name}
                onBack={onBack}
                onSettings={() => onNavigate("settings")}
                onNotifications={() => onNavigate("notifications")}
            />

            <ScrollView style={styles.container}>
                <Text variant="headlineSmall">
                    {menuList.name}
                </Text>

                <Text variant="bodyMedium" style={styles.infoText}>
                    Ruokalista 
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 16,
    },
    infoText: {
        marginTop: 8,
    },
});

export default MenuDetailScreen;