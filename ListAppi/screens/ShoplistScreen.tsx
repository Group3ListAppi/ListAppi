import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import ScreenLayout from '../components/ScreenLayout';
import { ActionModal } from '../components/ActionModal';

interface ShoplistScreenProps {
  activeScreen: string
  onNavigate: (screen: string) => void
}

const ShoplistScreen: React.FC<ShoplistScreenProps> = ({ activeScreen, onNavigate }) => {
  const [modalVisible, setModalVisible] = useState(false)

  const handleOpenModal = () => setModalVisible(true)
  const handleCloseModal = () => setModalVisible(false)

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
        <Button mode="contained" onPress={handleOpenModal}>
          Toiminnot
        </Button>
      </View>
      <ActionModal
        visible={modalVisible}
        onClose={handleCloseModal}
        title="Valitse toiminto"
        actionIds={['share', 'remove']}
        onShare={handleShare}
        onRemove={handleRemove}
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
