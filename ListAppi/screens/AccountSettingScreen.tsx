import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, useTheme, List, Avatar } from 'react-native-paper';
import ScreenLayout from '../components/ScreenLayout';
import { useAuth } from '../auth/useAuth';

interface AccountSettingScreenProps {
  activeScreen: string
  onBack: () => void
  onNavigate: (screen: string) => void
}

const AccountSettingScreen: React.FC<AccountSettingScreenProps> = ({ activeScreen, onBack, onNavigate }) => {
  const theme = useTheme();
  const { user } = useAuth();

  const handleAccountAction = (action: string) => {
    console.log("Account action:", action);
  };

  return (
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate}>
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
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            onPress={() => handleAccountAction("Muuta nimeä")}
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
