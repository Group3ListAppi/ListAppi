import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, ActivityIndicator, Searchbar } from 'react-native-paper';
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
import { SearchBar } from '../components/SearchBar';

interface MenuScreenProps {
  activeScreen: string
  onNavigate: (screen: string, data?: any) => void
}

const MenuScreen: React.FC<MenuScreenProps> = ({ activeScreen, onNavigate }) => {
  const [listModalVisible, setListModalVisible] = useState(false)
  const { user } = useAuth()
  const [menuLists, setMenuLists] = useState<MenuList[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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
        recipes: [],
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

  const filteredLists = menuLists.filter(list =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate} fabLabel="Lisää uusi ruokalista" showFAB={true} onFABPress={() => setListModalVisible(true)}>
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
          <View style={styles.searchContainer}>
            <SearchBar
              placeholder="Hae ruokalistaa..."
              onChangeText={setSearchQuery}
              value={searchQuery}
            />
          </View>
          
          <ScrollView style={styles.listContainer}>
            {filteredLists.map((list) => (
              <ListButton
                key={list.id}
                listName={list.name}
                createdAt={list.createdAt}
                ownerAvatar={user?.photoURL || undefined}
                ownerInitials={user?.displayName?.charAt(0).toUpperCase() || "U"}
                onPress={() => onNavigate('menu-detail', list)}
                onDelete={() => handleDeleteMenuList(list.id)}
                onEdit={() => onNavigate('menu-detail', list)}
                onShare={() => {
                  // TODO: jako toiminnallisuus
                }}
                customActionIds={['share', 'edit', 'remove']}
              />
            ))}
          </ScrollView>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchbar: {
    height: 40,
  },
});

export default MenuScreen;
