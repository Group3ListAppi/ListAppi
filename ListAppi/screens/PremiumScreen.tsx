import React, { useState } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, useTheme, Button, Card, List } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenLayout from '../components/ScreenLayout';

interface PremiumScreenProps {
  activeScreen: string;
  onBack: () => void;
  onNavigate: (screen: string) => void;
  isPremium: boolean;
  onActivatePremium: () => Promise<void>;
  onCancelPremium: () => Promise<void>;
}

const PremiumScreen: React.FC<PremiumScreenProps> = ({ 
  activeScreen, 
  onBack, 
  onNavigate, 
  isPremium,
  onActivatePremium,
  onCancelPremium 
}) => {
  const theme = useTheme();
  const [processing, setProcessing] = useState(false);

  const handlePurchase = async () => {
    setProcessing(true);
    try {
      await onActivatePremium();
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    setProcessing(true);
    try {
      await onCancelPremium();
    } catch (error) {
      console.error('Cancel error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const features = [
    {
      icon: 'block-helper',
      title: 'Ei mainoksia',
      description: 'Nauti sovelluksesta ilman häiritseviä mainoksia'
    },
    {
      icon: 'star',
      title: 'Tuki kehitykselle',
      description: 'Auta meitä kehittämään sovellusta edelleen'
    }
  ];

  // Jos käyttäjällä on jo Premium
  if (isPremium) {
    return (
      <ScreenLayout
        activeScreen={activeScreen}
        onNavigate={onNavigate}
        showNav={false}
        showBack={true}
        onBack={onBack}
        hideActions={true}
        customTitle="Premium"
      >
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <MaterialCommunityIcons 
              name="crown" 
              size={64} 
              color={theme.colors.primary} 
            />
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
              Olet Premium-jäsen!
            </Text>
            <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Kiitos tuestasi! Nautit nyt sovelluksesta ilman mainoksia.
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Premium-etusi
            </Text>
            
            {features.map((feature, index) => (
              <List.Item
                key={index}
                title={feature.title}
                description={feature.description}
                left={(props) => (
                  <MaterialCommunityIcons 
                    name="check-circle" 
                    size={24} 
                    color={theme.colors.primary}
                    style={{ marginRight: 8 }}
                  />
                )}
                titleStyle={{ fontWeight: '600' }}
                style={styles.featureItem}
              />
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              loading={processing}
              disabled={processing}
              style={styles.cancelButton}
              contentStyle={styles.buttonContent}
              textColor={theme.colors.error}
            >
              Peruuta Premium-tilaus
            </Button>
            
            <Text variant="bodySmall" style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}>
              Peruuttamisen jälkeen mainokset palautuvat sovellukseen.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </ScreenLayout>
    );
  }

  // Jos käyttäjällä ei ole Premium-tilausta
  return (
    <ScreenLayout
      activeScreen={activeScreen}
      onNavigate={onNavigate}
      showNav={false}
      showBack={true}
      onBack={onBack}
      hideActions={true}
      customTitle="Premium"
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons 
            name="crown" 
            size={64} 
            color={theme.colors.primary} 
          />
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
            Liity Premium-jäseneksi
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Poista mainokset ja tue sovelluksen kehitystä
          </Text>
        </View>

        <Card style={[styles.priceCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content style={styles.priceContent}>
            <Text variant="displaySmall" style={[styles.price, { color: theme.colors.onPrimaryContainer }]}>
              4,99 €
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
              / kuukausi
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.featuresContainer}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Premium-edut
          </Text>
          
          {features.map((feature, index) => (
            <List.Item
              key={index}
              title={feature.title}
              description={feature.description}
              left={(props) => (
                <MaterialCommunityIcons 
                  name={feature.icon as any}
                  size={24} 
                  color={theme.colors.primary}
                  style={{ marginRight: 8 }}
                />
              )}
              titleStyle={{ fontWeight: '600' }}
              style={styles.featureItem}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handlePurchase}
            loading={processing}
            disabled={processing}
            style={styles.purchaseButton}
            contentStyle={styles.buttonContent}
          >
            Liity Premium-jäseneksi
          </Button>
          
          <Text variant="bodySmall" style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}>
            Voit peruuttaa milloin tahansa.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 32,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  priceCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    elevation: 0,
  },
  priceContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  price: {
    fontWeight: '700',
    marginRight: 4,
  },
  featuresContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  featureItem: {
    paddingVertical: 8,
  },
  buttonContainer: {
    paddingHorizontal: 16,
  },
  purchaseButton: {
    borderRadius: 12,
    marginBottom: 16,
  },
  cancelButton: {
    borderRadius: 12,
    marginBottom: 16,
    borderColor: 'transparent',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  disclaimer: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PremiumScreen;