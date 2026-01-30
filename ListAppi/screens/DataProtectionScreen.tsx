import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import ScreenLayout from '../components/ScreenLayout';

interface DataProtectionScreenProps {
  activeScreen: string;
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
}

const DataProtectionScreen: React.FC<DataProtectionScreenProps> = ({ activeScreen, onBack, onNavigate }) => {
  const theme = useTheme();

  return (
    <ScreenLayout
      activeScreen={activeScreen}
      onNavigate={onNavigate}
      showNav={false}
      showBack={true}
      onBack={onBack}
      customTitle="Tietosuoja"
    >
      <ScrollView style={styles.container}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
          Tietosuoja
        </Text>

        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Yleistä
        </Text>
        <Text variant="bodyMedium" style={[styles.text, { color: theme.colors.onSurface }]}>
          Tämä sovellus on opiskelijaprojekti. Rekisterinpitäjänä toimii sovelluksen kehittäjät.
        </Text>

        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Kerätyt tiedot
        </Text>
        <Text variant="bodyMedium" style={[styles.text, { color: theme.colors.onSurface }]}>
          Sovellus kerää seuraavat tiedot:
        </Text>
        <Text variant="bodyMedium" style={[styles.bulletText, { color: theme.colors.onSurface }]}>
          • Käyttäjä-ID ja sähköpostiosoite kirjautumista varten{'\n'}
          • Käyttäjän luomat reseptit{'\n'}
          • Ostoslistat ja niiden sisältö{'\n'}
          • Ruokalistat ja niiden sisältö{'\n'}
          • Käyttäjän profiilin tiedot
        </Text>

        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Tietojen käyttö
        </Text>
        <Text variant="bodyMedium" style={[styles.text, { color: theme.colors.onSurface }]}>
          Tietoja käytetään ainoastaan sovelluksen toimintaan ja seuraaviin tarkoituksiin:
        </Text>
        <Text variant="bodyMedium" style={[styles.bulletText, { color: theme.colors.onSurface }]}>
          • Käyttäjätilin hallintaan{'\n'}
          • Sovelluksen toimintoon ja palveluiden tarjoamiseen{'\n'}
          • Jaettujen sisältöjen toimintoon{'\n'}
          • Palvelun parantamiseen
        </Text>

        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Tietojen turvallisuus
        </Text>
        <Text variant="bodyMedium" style={[styles.text, { color: theme.colors.onSurface }]}>
          Tietojasi suojataan asianmukaisesti. Tietoja ei luovuteta kolmansille osapuolille ilman suostumustasi.
        </Text>

        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Käyttäjän oikeudet
        </Text>
        <Text variant="bodyMedium" style={[styles.text, { color: theme.colors.onSurface }]}>
          Sinulla on oikeus tarkastella, korjata tai poistaa tietojasi. Voit ottaa yhteyttä sovelluksen kehittäjiin tai poistaa tilisi asetuksista.
        </Text>

        <Text variant="bodySmall" style={[styles.spacing, { color: theme.colors.onSurfaceVariant }]}>
          
        </Text>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 24,
    fontWeight: '700',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '600',
  },
  text: {
    marginBottom: 12,
    lineHeight: 22,
  },
  bulletText: {
    marginBottom: 16,
    lineHeight: 26,
    marginLeft: 4,
  },
  spacing: {
    height: 100,
  },
});

export default DataProtectionScreen;