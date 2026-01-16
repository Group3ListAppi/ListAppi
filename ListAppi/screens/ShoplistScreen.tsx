import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import ScreenLayout from '../components/ScreenLayout';
import { ActionModal } from '../components/ActionModal';
import { ShareModal } from '../components/ShareModal';

interface ShoplistScreenProps {
  activeScreen: string
  onNavigate: (screen: string) => void
}

const ShoplistScreen: React.FC<ShoplistScreenProps> = ({ activeScreen, onNavigate }) => {
  const [ActionModalVisible, setActionModalVisible] = useState(false)
  const [ShareModalVisible, setShareModalVisible] = useState(false)

  const handleOpenActionModal = () => setActionModalVisible(true)
  const handleCloseActionModal = () => setActionModalVisible(false)
  const handleOpenShareModal = () => setShareModalVisible(true)
  const handleCloseShareModal = () => setShareModalVisible(false)
  const handleShare = () => {
    console.log('Share action')
  }

  const handleRemove = () => {
    console.log('Remove action')
  }

  return (
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate}>
      <Text variant="headlineMedium">Ostoslista</Text>
      <Text variant="bodyMedium" style={styles.description}>
        Hallinnoi ostoslistaasi.
      </Text>
      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={handleOpenActionModal}>
          Toiminnot (testi)
        </Button>
      </View>
      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={handleOpenShareModal}>
          Jaa (testi)
        </Button>
      </View>
      <ActionModal
        visible={ActionModalVisible}
        onClose={handleCloseActionModal}
        title="Valitse toiminto"
        actionIds={['share', 'remove']}
        onShare={handleShare}
        onRemove={handleRemove}
      />
      <ShareModal
        visible={ShareModalVisible}
        onClose={handleCloseShareModal}
        title="Jaa ostoslista"
      />
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  description: {
    marginTop: 8,
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 16,
  },
})

export default ShoplistScreen
