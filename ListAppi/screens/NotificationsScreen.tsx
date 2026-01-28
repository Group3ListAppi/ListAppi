import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Text, useTheme, Card, Button, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ScreenLayout from "../components/ScreenLayout";
import { useAuth } from "../auth/useAuth";
import { getPendingInvitations, acceptInvitation, declineInvitation, Invitation } from "../firebase/invitationUtils";

type Props = {
  activeScreen: string;
  onBack: () => void;
  onNavigate: (screen: string) => void;
};

export default function NotificationsScreen({ activeScreen, onBack, onNavigate }: Props) {
  const theme = useTheme();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadInvitations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getPendingInvitations(user.uid);
      setInvitations(data);
    } catch (error) {
      console.error('Error loading invitations:', error);
      Alert.alert('Virhe', 'Kutsujen lataaminen epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadInvitations();
    }
  }, [user]);

  const handleAccept = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      await acceptInvitation(invitationId);
      Alert.alert('Onnistui!', 'Kutsu hyväksytty');
      await loadInvitations();
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Virhe', error.message || 'Kutsun hyväksyminen epäonnistui');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      await declineInvitation(invitationId);
      Alert.alert('Onnistui!', 'Kutsu hylätty');
      await loadInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
      Alert.alert('Virhe', 'Kutsun hylkääminen epäonnistui');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <ScreenLayout 
      activeScreen={activeScreen} 
      onNavigate={onNavigate} 
      showNav={false}
      showBack={true}
      onBack={onBack}
      customTitle="Ilmoitukset"
    >
      <ScrollView style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : invitations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={64}
              color={theme.colors.onSurfaceDisabled}
            />
            <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.onSurfaceDisabled }]}>
              Ei uusia kutsuja
            </Text>
          </View>
        ) : (
          invitations.map((invitation) => (
            <Card key={invitation.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name={
                      invitation.itemType === 'recipe' ? 'silverware-fork-knife' : 
                      invitation.itemType === 'menu' ? 'calendar-text' : 
                      'format-list-checkbox'
                    }
                    size={24}
                    color={theme.colors.primary}
                  />
                  <View style={styles.headerText}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                      {invitation.itemType === 'recipe' ? 'Resepti lähetetty' : 
                       invitation.itemType === 'menu' ? 'Ruokalista jaettu' :
                       invitation.itemType === 'recipeCollection' ? 'Reseptikokoelma jaettu' :
                       'Ostoslista jaettu'
                      }
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {new Date(invitation.createdAt).toLocaleDateString('fi-FI', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.contentSection}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                    <Text style={{ fontWeight: 'bold' }}>{invitation.fromUserDisplayName}</Text>
                    {invitation.itemType === 'recipe'
                      ? ' haluaa lähettää sinulle reseptin:'
                      : ' haluaa jakaa kanssasi:'}
                  </Text>
                  <Text variant="titleSmall" style={[styles.itemName, { color: theme.colors.primary }]}>
                    {invitation.itemName}
                  </Text>
                  {invitation.itemType === 'recipeCollection' && (
                    <Text variant="bodySmall" style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}>
                      Hyväksymällä tämän kutsun, voitte yhdessä hallinnoida kokoelman sisältöä.
                    </Text>
                  )}
                  {(invitation.itemType === 'menu' || invitation.itemType === 'shoplist') && (
                    <Text variant="bodySmall" style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}>
                      Hyväksymällä tämän kutsun, voitte yhdessä hallinnoida listan sisältöä.
                    </Text>
                  )}
                </View>

                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={() => handleAccept(invitation.id)}
                    style={[styles.button, styles.acceptButton]}
                    buttonColor={theme.colors.primary}
                    disabled={actionLoading !== null}
                    loading={actionLoading === invitation.id}
                  >
                    Hyväksy
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => handleDecline(invitation.id)}
                    style={[styles.button, styles.declineButton]}
                    textColor={theme.colors.error}
                    disabled={actionLoading !== null}
                  >
                    Hylkää
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  contentSection: {
    marginBottom: 16,
  },
  itemName: {
    marginTop: 8,
  },
  disclaimer: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
  },
  acceptButton: {
  },
  declineButton: {
    borderColor: 'transparent',
  },
});

