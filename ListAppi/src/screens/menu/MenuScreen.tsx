// src/screens/menu/MenuScreen.tsx
import React from 'react';
import { FlatList, View } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AnimatedFAB } from '../../components/shared/AnimatedFAB';

const MOCK_DATA = [
  { id: '1', title: 'Maanantai: Lihapullat' },
  { id: '2', title: 'Tiistai: Kalakeitto' },
  { id: '3', title: 'Keskiviikko: Kasvislasagne' },
];

export const MenuScreen = () => {
  const handleAddMenu = () => {
    console.log('Lisätään uusi ruokalista...');
  };

  return (
    <ScreenWrapper
      floatingActionButton={
        <AnimatedFAB 
          label="Luo uusi lista" 
          onPress={handleAddMenu} 
        />
      }
    >
      <FlatList
        data={MOCK_DATA}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider />}
        renderItem={({ item }) => (
          <View style={{ padding: 20 }}>
            <Text variant="bodyLarge">{item.title}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }} // Tilaa FAB-napille
      />
    </ScreenWrapper>
  );
};