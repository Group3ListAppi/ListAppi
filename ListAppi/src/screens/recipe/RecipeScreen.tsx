// src/screens/recipe/RecipeScreen.tsx
import React, { useState, useLayoutEffect } from 'react';
import { FlatList, View, TouchableOpacity } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AnimatedFAB } from '../../components/shared/AnimatedFAB';
import { ActionModal } from '../../components/shared/ActionModal';
import { ACTION_DEFS } from '../../constants/actions';
import { useGlobalActions } from '../../hooks/useGlobalActions'; // Hook käyttöön

export const RecipeScreen = () => {
  const navigation = useNavigation();
  const { appBarActions } = useGlobalActions(); // Haetaan globaalit toiminnot
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'appbar' | 'recipe'>('appbar');
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  // Yhdistetty yläpalkin hallinta
  useLayoutEffect(() => {
    navigation.setOptions({
      onMenuPress: () => {
        setModalType('appbar');
        setModalOpen(true);
      },
    });
  }, [navigation]);

  // Sivukohtaiset toiminnot
  const recipeActions = [
    { ...ACTION_DEFS.edit, onPress: () => console.log('Muokkaa:', selectedRecipe) },
    { ...ACTION_DEFS.share, label: 'Jaa resepti', onPress: () => console.log('Jaa:', selectedRecipe) },
    { ...ACTION_DEFS.delete, onPress: () => console.log('Poista:', selectedRecipe) },
  ];

  return (
    <>
      <ScreenWrapper
        floatingActionButton={
          <AnimatedFAB label="Luo uusi" onPress={() => console.log('Uusi!')} />
        }
      >
        <FlatList
          data={[{ id: '1', title: 'Lihapullat' }, { id: '2', title: 'Pasta' }]}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={{ padding: 20 }}
              onPress={() => {
                setSelectedRecipe(item);
                setModalType('recipe'); // Vaihdetaan tyyppi reseptiksi
                setModalOpen(true);
              }}
            >
              <Text variant="bodyLarge">{item.title}</Text>
            </TouchableOpacity>
          )}
        />
      </ScreenWrapper>

      <ActionModal 
        visible={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalType === 'appbar' ? "Toiminnot" : selectedRecipe?.title}
        actions={modalType === 'appbar' ? appBarActions : recipeActions}
      />
    </>
  );
};