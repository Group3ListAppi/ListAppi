import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Alert, Pressable } from 'react-native';
import { Text, useTheme, List, Avatar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import ScreenLayout from '../components/ScreenLayout';
import { AdBanner } from '../components/AdBanner';
import { useAuth } from '../auth/useAuth';
import EditDisplayNameDialog from "../components/EditDisplayNameDialog"
import { getUserProfile, removeMyAvatar, updateMyAvatar } from "../firebase/userProfileUtils"
import { convertImageToBase64 } from "../firebase/imageUtils"
import { ActionModal } from "../components/ActionModal"
import ChangePasswordDialog from "../components/ChangePasswordDialog"
import DeleteAccountDialog from "../components/DeleteAccountDialog"
import ChangeEmailDialog from "../components/ChangeEmailDialog"


interface AccountSettingScreenProps {
  activeScreen: string
  onBack: () => void
  onNavigate: (screen: string) => void
  isPremium?: boolean;
}

const AccountSettingScreen: React.FC<AccountSettingScreenProps> = ({ activeScreen, onBack, onNavigate, isPremium }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("")
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "")
  const [editNameOpen, setEditNameOpen] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [changeEmailOpen, setChangeEmailOpen] = useState(false)
  const [changePwOpen, setChangePwOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)

// Lataa näyttönimi Firestoresta kun screen aukeaa / user vaihtuu
  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return
      try {
        const profile = await getUserProfile(user.uid)
        const name = (profile?.displayName ?? user.displayName ?? "").trim()
        setDisplayName(name)
        setPhotoURL(profile?.photoURL ?? user.photoURL ?? "")
      } catch {
        setDisplayName((user.displayName ?? "").trim())
        setPhotoURL(user?.photoURL ?? "")
      }
    }
    run()
  }, [user?.uid])

  useEffect(() => {
    setPhotoURL(user?.photoURL || "")
  }, [user?.photoURL])

  const pickAvatarFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Oikeudet vaaditaan', 'Tarvitsemme pääsynkuvakirjastoon');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSavingAvatar(true);
        try {
          const base64 = await convertImageToBase64(result.assets[0].uri);
          await updateMyAvatar(base64);
          setPhotoURL(base64);
          Alert.alert('Onnistui', 'Avatar päivitetty');
        } finally {
          setSavingAvatar(false);
        }
      }
    } catch (error) {
      Alert.alert('Virhe', 'Avatarin vaihdossa tapahtui virhe');
      setSavingAvatar(false);
    }
  };

  const takeAvatarWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Oikeudet vaaditaan', 'Tarvitsemme pääsyyn kameraan');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSavingAvatar(true);
        try {
          const base64 = await convertImageToBase64(result.assets[0].uri);
          await updateMyAvatar(base64);
          setPhotoURL(base64);
          Alert.alert('Onnistui', 'Avatar päivitetty');
        } finally {
          setSavingAvatar(false);
        }
      }
    } catch (error) {
      Alert.alert('Virhe', 'Kuvan ottamisessa tapahtui virhe');
      setSavingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    if (!photoURL) {
      Alert.alert('Ei profiilikuvaa', 'Sinulla ei ole profiilikuvaa poistettavaksi.');
      return;
    }

    try {
      setSavingAvatar(true);
      await removeMyAvatar();
      setPhotoURL("");
      Alert.alert('Onnistui', 'Profiilikuva poistettu');
    } catch (error) {
      Alert.alert('Virhe', 'Profiilikuvan poistaminen epäonnistui');
    } finally {
      setSavingAvatar(false);
    }
  };

  const avatarLetter = (displayName?.charAt(0) || user?.displayName?.charAt(0) || "U").toUpperCase()


  return (
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate}>
      <AdBanner isPremium={isPremium} />
       <EditDisplayNameDialog
        visible={editNameOpen}
        initialName={displayName}
        onClose={() => setEditNameOpen(false)}
        onSaved={(newName) => setDisplayName(newName)}
      />
      <ChangePasswordDialog
        visible={changePwOpen}
        onClose={() => setChangePwOpen(false)}
        onSaved={() => {
          // optional: voit näyttää snackbarin tms jos teillä on
          console.log("Password updated")
        }}
      />
      <ChangeEmailDialog
        visible={changeEmailOpen}
        onClose={() => setChangeEmailOpen(false)}
        onSaved={() => {
          console.log("Email updated")
        }}
      />
      <DeleteAccountDialog
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
      />
      <ActionModal
        visible={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        title="Valitse uusi profiilikuva"
        actionIds={['camera', 'gallery', 'removeAvatar']}
        onCamera={takeAvatarWithCamera}
        onGallery={pickAvatarFromGallery}
        onRemoveAvatar={removeAvatar}
      />
      <ScrollView>
        {/* Avatar ja sähköposti */}
        <View style={styles.userSection}>
          <Pressable onPress={() => setShowAvatarPicker(true)} disabled={savingAvatar}>
            {photoURL ? (
              <Avatar.Image size={80} source={{ uri: photoURL }} />
            ) : (
              <Avatar.Text size={80} label={displayName?.charAt(0).toUpperCase() || user?.displayName?.charAt(0).toUpperCase() || "U"} />
            )}
          </Pressable>
          <Text variant="bodyLarge" style={styles.email}>
            {user?.email}
          </Text>
        </View>

        {/* Tilin hallinta */}
        <List.Section>
          <List.Subheader>Tilin hallinta</List.Subheader>
          <List.Item
            title="Vaihda tai poista profiilikuva"
            description="Kamera tai galleria"
            left={(props) => <List.Icon {...props} icon="account-circle" />}
            onPress={() => setShowAvatarPicker(true)}
          />
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
            onPress={() => setChangeEmailOpen(true)}
          />
          <List.Item
            title="Vaihda salasana"
            left={(props) => <List.Icon {...props} icon="lock-reset" />}
            onPress={() => setChangePwOpen(true)}
          />
          <List.Item
            title="Poista tili"
            titleStyle={{ color: theme.colors.error }}
            left={(props) => (
              <List.Icon {...props} icon="delete-alert" color={theme.colors.error} />
            )}
            onPress={() => setDeleteOpen(true)}
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
