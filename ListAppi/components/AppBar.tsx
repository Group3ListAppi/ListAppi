import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Appbar, Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActionModal } from "./ActionModal";

type TopAppBarProps = {
  title: string;
  //takaisin
  onBack?: () => void;
  //asetukset
  onSettings?: () => void;
  //roskakori
  onTrash?: () => void;
  //uloskirjautuminen
  onLogout?: () => void;
  //avatar URL
  avatarUrl?: string;
  //notifications
  onNotifications?: () => void;
};

const TopAppBar = ({ title, onBack, onSettings, onTrash, onLogout, avatarUrl, onNotifications }: TopAppBarProps) => {
  const [actionModalVisible, setActionModalVisible] = useState(false);

  const handleOpenActionModal = () => {
    setActionModalVisible(true);
  };

  const handleCloseActionModal = () => {
    setActionModalVisible(false);
  };

  return (
    <Appbar.Header>
      {/* Vasen puoli: back jos on, muuten näkymätön spacer */}
      {onBack ? (
        <Appbar.Action icon="arrow-left" onPress={onBack} />
      ) : (
        <View style={styles.spacer} />
      )}

      <Appbar.Content title={title} style={{ alignItems: "center" }} />

      {/* Oikea puoli: bell ja dots */}
      
      <Appbar.Action 
        icon="bell" 
        onPress={onNotifications} 
      />

      <Appbar.Action icon="dots-vertical" onPress={handleOpenActionModal} />

      <ActionModal
        visible={actionModalVisible}
        onClose={handleCloseActionModal}
        title=""
        actionIds={["settings", "remove", "logout"]}
        onSettings={onSettings}
        onRemove={onTrash}
        onLogout={onLogout}
        removeLabel="Roskakori"
      />
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  spacer: { width: 48 },
  avatar: { marginHorizontal: 8 },
});

export default TopAppBar;