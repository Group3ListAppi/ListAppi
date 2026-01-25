import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { Text, useTheme, List, Switch } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ScreenOrientation from "expo-screen-orientation";
import AppBar from "../components/AppBar";
import ScreenLayout from "../components/ScreenLayout";

type Props = {
  activeScreen: string;
  onBack: () => void;
  onNavigate: (screen: string) => void;
};

export default function SettingsScreen({ activeScreen, onBack, onNavigate }: Props) {
  const theme = useTheme();
  const [keepScreenOn, setKeepScreenOn] = useState(false);

  // Lataa asetukset AsyncStoragesta
  useEffect(() => {
    const loadSetting = async () => {
      try {
        const saved = await AsyncStorage.getItem("keepScreenOn");
        if (saved !== null) {
          setKeepScreenOn(JSON.parse(saved));
        }
      } catch (error) {
        console.log("Error loading keepScreenOn setting:", error);
      }
    };
    loadSetting();
  }, []);

  // Tallentaa asetukset muutettaessa
  const handleKeepScreenOnChange = async (value: boolean) => {
    try {
      setKeepScreenOn(value);
      await AsyncStorage.setItem("keepScreenOn", JSON.stringify(value));
      
      // Lisää tai poista näytön lukitus asetuksen mukaan
      if (value) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      } else {
        await ScreenOrientation.unlockAsync();
      }
    } catch (error) {
      console.log("Error saving keepScreenOn setting:", error);
    }
  };

  const handleNavigation = (section: string) => {
    if (section === "Tyyli") {
      onNavigate("StyleScreen");
    } else {
      console.log("Navigating to:", section);
    }
  };

  return (
    <ScreenLayout 
      activeScreen={activeScreen} 
      onNavigate={onNavigate} 
      showNav={false}
      showBack={true}
      onBack={onBack}
      customTitle="Asetukset"
    >
      <ScrollView style={styles.content}>
        {/* Yleiset */}
        <List.Section>
          <List.Subheader>Yleiset</List.Subheader>
          <List.Item
            title="Tyyli"
            left={(props) => <List.Icon {...props} icon="palette" />}
            onPress={() => handleNavigation("Tyyli")}
          />
          <List.Item
            title="Ilmoitukset"
            left={(props) => <List.Icon {...props} icon="bell" />}
            onPress={() => handleNavigation("Ilmoitukset")}
          />
          <List.Item
            title="Älä sammuta näyttöä"
            left={(props) => <List.Icon {...props} icon="monitor" />}
            right={() => (
              <Switch 
                value={keepScreenOn} 
                onValueChange={handleKeepScreenOnChange}
              />
            )}
          />
          <List.Item
            title="Poista mainokset"
            left={(props) => <List.Icon {...props} icon="block-helper" />}
            onPress={() => handleNavigation("Poista mainokset")}
          />
        </List.Section>

        {/* Tuki */}
        <List.Section>
          <List.Subheader>Tuki</List.Subheader>
          <List.Item
            title="Ilmoita ongelmasta"
            left={(props) => <List.Icon {...props} icon="bug" />}
            onPress={() => handleNavigation("Ilmoita ongelmasta")}
          />
          <List.Item
            title="Yleinen palaute"
            left={(props) => <List.Icon {...props} icon="message-text" />}
            onPress={() => handleNavigation("Yleinen palaute")}
          />
        </List.Section>

        {/* Sovellus */}
        <List.Section>
          <List.Subheader>Sovellus</List.Subheader>
          <List.Item
            title="Arvioi meidät Google Playssa"
            left={(props) => <List.Icon {...props} icon="star" />}
            onPress={() => handleNavigation("Arvioi meidät Google Playssa")}
          />
          <List.Item
            title="Tietosuoja"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            onPress={() => handleNavigation("Tietosuoja")}
          />
        </List.Section>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});