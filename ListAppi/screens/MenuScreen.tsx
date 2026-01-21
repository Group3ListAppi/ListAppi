import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import ScreenLayout from '../components/ScreenLayout';
import ListModal from '../components/ListModal';
import { AddNewButton } from '../components/AddNewButton';
import { ListButton } from '../components/ListButton';
import { useAuth } from '../auth/useAuth';
import {
  saveMenuListToFirestore,
  getUserMenuLists,
  deleteMenuListFromFirestore,
  type MenuList,
} from '../firebase/menuUtils';
import { type CreateListFormData } from '../components/ListModal';

interface MenuScreenProps {
  activeScreen: string
  onNavigate: (screen: string, data?: any) => void
}

const MenuScreen: React.FC<MenuScreenProps> = ({ activeScreen, onNavigate }) => {
  const [listModalVisible, setListModalVisible] = useState(false)
  const { user } = useAuth()
  const [menuLists, setMenuLists] = useState<MenuList[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.uid && activeScreen === 'menu') {
      loadLists();
    }
  }, [user, activeScreen]);

  const loadLists = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const userMenuLists = await getUserMenuLists(user.uid);
      setMenuLists(userMenuLists);
    } catch (error) {
      console.error('Error loading menu lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMenuList = async (list: CreateListFormData) => {
    if (!user?.uid) return;
    try {
      const listId = await saveMenuListToFirestore(list, user.uid);
      const newList: MenuList = {
        id: listId,
        name: list.name.trim(),
        type: "menu",
        userId: user.uid,
        createdAt: new Date(),
      };
      setMenuLists([...menuLists, newList]);
      setListModalVisible(false);
    } catch (error) {
      console.error('Error saving menu list:', error);
    }
  };

  const handleDeleteMenuList = async (id: string) => {
    try {
      await deleteMenuListFromFirestore(id);
      setMenuLists(menuLists.filter(list => list.id !== id));
    } catch (error) {
      console.error('Error deleting menu list:', error);
    }
  };

  return (
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : menuLists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="headlineMedium">Ruokalistat</Text>
          <Text variant="bodyMedium" style={styles.description}>
            Hallinnoi ruokalistojasi tässä.
          </Text>
          
          <AddNewButton
            onPress={() => setListModalVisible(true)}
            label="Lisää uusi ruokalista"
            animate={false}
          />
        </View>
      ) : (
        <>
        <ScrollView style={styles.listContainer}>
          {menuLists.map((list) => (
            <ListButton
              key={list.id}
              listName={list.name}
              onPress={() => onNavigate('menu-detail', list)}
              onDelete={() => handleDeleteMenuList(list.id)}
            />
          ))}
        </ScrollView>

      <AddNewButton
        onPress={() => setListModalVisible(true)}
        label="Lisää uusi ruokalista"
      />
      </>
      )}

      <ListModal
        visible={listModalVisible}
        type="menu"
        onClose={() => setListModalVisible(false)}
        onSave={handleSaveMenuList}
      />
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default MenuScreen
