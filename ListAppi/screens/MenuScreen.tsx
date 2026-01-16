import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import ScreenLayout from '../components/ScreenLayout';
import ListModal from '../components/ListModal';

interface MenuScreenProps {
  activeScreen: string
  onNavigate: (screen: string) => void
}

const MenuScreen: React.FC<MenuScreenProps> = ({ activeScreen, onNavigate }) => {
  const [listModalVisible, setListModalVisible] = useState(false)

  return (
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate}>
      <Text variant="headlineMedium">Ruokalistat</Text>
      <Text variant="bodyMedium">
        Hallinnoi ruokailistaasi tässä.
      </Text>

      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={() => setListModalVisible(true)}>
          Lisää uusi ruokalista
        </Button>
      </View>

      <ListModal
        visible={listModalVisible}
        type="menu"
        onClose={() => setListModalVisible(false)}
        onSave={(list) => {
          console.log('Tallennettu ruokalista:', list)
        }}
      />
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  description: {
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 16,
  },
});

export default MenuScreen
