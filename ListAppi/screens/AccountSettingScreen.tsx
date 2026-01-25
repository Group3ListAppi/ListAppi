import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, useTheme, List, Avatar } from 'react-native-paper';
import ScreenLayout from '../components/ScreenLayout';
import { useAuth } from '../auth/useAuth';
import EditDisplayNameDialog from "../components/EditDisplayNameDialog"
import { getUserProfile } from "../firebase/userProfileUtils"


interface AccountSettingScreenProps {
  activeScreen: string
  onBack: () => void
  onNavigate: (screen: string) => void
}

const AccountSettingScreen: React.FC<AccountSettingScreenProps> = ({ activeScreen, onBack, onNavigate }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("")
  const [editNameOpen, setEditNameOpen] = useState(false)

// Lataa näyttönimi Firestoresta kun screen aukeaa / user vaihtuu
  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return
      try {
        const profile = await getUserProfile(user.uid)
        const name = (profile?.displayName ?? user.displayName ?? "").trim()
        setDisplayName(name)
      } catch {
        setDisplayName((user.displayName ?? "").trim())
      }
    }
    run()
  }, [user?.uid])

  const avatarLetter = (displayName?.charAt(0) || user?.displayName?.charAt(0) || "U").toUpperCase()


  const handleAccountAction = (action: string) => {
    console.log("Account action:", action);
  };

  return (
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate}>
       <EditDisplayNameDialog
        visible={editNameOpen}
        initialName={displayName}
        onClose={() => setEditNameOpen(false)}
        onSaved={(newName) => setDisplayName(newName)}
      />
      <ScrollView>
        {/* Avatar ja sähköposti */}
        <View style={styles.userSection}>
          {user?.photoURL ? (
            <Avatar.Image size={80} source={{ uri: user.photoURL }} />
          ) : (
            <Avatar.Text size={80} label={user?.displayName?.charAt(0).toUpperCase() || "U"} />
          )}
          <Text variant="bodyLarge" style={styles.email}>
            {user?.email}
          </Text>
        </View>

        {/* Tilin hallinta */}
        <List.Section>
          <List.Subheader>Tilin hallinta</List.Subheader>
          <List.Item
            title="Muuta nimeä"
            description={displayName ? `Nykyinen: ${displayName}` : "Aseta näyttönimi"}
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            // 3) Avaa dialogi tästä
            onPress={() => setEditNameOpen(true)}
          />
          <List.Item
            title="Vaihda sähköposti"
            left={(props) => <List.Icon {...props} icon="email-edit" />}
            onPress={() => handleAccountAction("Vaihda sähköposti")}
          />
          <List.Item
            title="Vaihda salasana"
            left={(props) => <List.Icon {...props} icon="lock-reset" />}
            onPress={() => handleAccountAction("Vaihda salasana")}
          />
          <List.Item
            title="Poista tili"
            titleStyle={{ color: theme.colors.error }}
            left={(props) => <List.Icon {...props} icon="delete-alert" color={theme.colors.error} />}
            onPress={() => handleAccountAction("Poista tili")}
          />
        </List.Section>
      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  userSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  email: {
    marginTop: 12,
    textAlign: 'center',
  },
})

export default AccountSettingScreen
