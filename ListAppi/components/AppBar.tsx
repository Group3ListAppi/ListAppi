import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Appbar, Avatar, Badge } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActionModal } from "./ActionModal";
import { useAuth } from "../auth/useAuth";
import { getPendingInvitations } from "../firebase/invitationUtils";

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
  //custom right content
  rightElement?: React.ReactNode;
  //hide default actions
  hideActions?: boolean;
};

const TopAppBar = ({ title, onBack, onSettings, onTrash, onLogout, avatarUrl, onNotifications, rightElement, hideActions }: TopAppBarProps) => {
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [invitationCount, setInvitationCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadInvitationCount();
      
      // Poll for new invitations every 30 seconds
      const interval = setInterval(() => {
        loadInvitationCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const loadInvitationCount = async () => {
    if (!user) return;
    
    try {
      const invitations = await getPendingInvitations(user.uid);
      setInvitationCount(invitations.length);
    } catch (error) {
      console.error('Error loading invitation count:', error);
    }
  };

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

      {/* Oikea puoli: custom element or default actions */}
      {rightElement ? (
        <View style={styles.rightElement}>{rightElement}</View>
      ) : hideActions ? (
        <View style={styles.spacer} />
      ) : (
        <>
          <View style={styles.bellContainer}>
            <Appbar.Action 
              icon="bell" 
              onPress={onNotifications} 
            />
            {invitationCount > 0 && (
              <Badge style={styles.badge} size={18}>
                {invitationCount}
              </Badge>
            )}
          </View>

          <Appbar.Action icon="dots-vertical" onPress={handleOpenActionModal} />
        </>
      )}

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
  bellContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  rightElement: {
    marginRight: 8,
  },
});

export default TopAppBar;