import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Image } from 'react-native';
import { Text, Button, ActivityIndicator, Searchbar } from 'react-native-paper';
import ScreenLayout from '../components/ScreenLayout';
import { AdBanner } from '../components/AdBanner';
import ListModal from '../components/ListModal';
import { AddNewButton } from '../components/AddNewButton';
import { ListButton } from '../components/ListButton';
import { useAuth } from '../auth/useAuth';
import {
  saveMenuListToFirestore,
  getUserMenuLists,
  moveMenuListToTrash,
  updateMenuListName,
  stopSharingMenuList,
  type MenuList,
} from '../firebase/menuUtils';
import { getUserProfiles } from '../firebase/userProfileUtils';
import { type CreateListFormData } from '../components/ListModal';

interface MenuScreenProps {
  activeScreen: string;
  onNavigate: (screen: string, data?: any) => void;
  isPremium?: boolean;
}

const MenuScreen: React.FC<MenuScreenProps> = ({ activeScreen, onNavigate, isPremium }) => {
  const [listModalVisible, setListModalVisible] = useState(false)
  const [editingMenuList, setEditingMenuList] = useState<MenuList | null>(null)
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
      
      // Hae omistajien profiilit kaikille ruokalistoille
      const ownerIds = [...new Set(userMenuLists.map(m => m.userId))];
      const ownerProfiles = await getUserProfiles(ownerIds);
      
      // Hae jaettujen käyttäjien profiilit
      const allSharedUserIds = new Set<string>();
      userMenuLists.forEach(menu => {
        menu.sharedWith?.forEach(id => allSharedUserIds.add(id));
      });
      const sharedUserProfiles = await getUserProfiles([...allSharedUserIds]);
      
      // Rikasta ruokalistat omistajatiedoilla ja jaetuilla käyttäjillä
      const enrichedMenus = userMenuLists.map(menu => ({
        ...menu,
        ownerName: ownerProfiles.get(menu.userId)?.displayName,
        ownerAvatar: ownerProfiles.get(menu.userId)?.photoURL,
        sharedUsers: menu.sharedWith?.map(uid => ({
          displayName: sharedUserProfiles.get(uid)?.displayName,
          photoURL: sharedUserProfiles.get(uid)?.photoURL,
        })) || [],
      }));
      
      setMenuLists(enrichedMenus);
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
        sharedWith: [],
        sharedUsers: [],
        ownerName: user.displayName || undefined,
        ownerAvatar: user.photoURL || undefined,
      };
      setMenuLists([...menuLists, newList]);
      setListModalVisible(false);
    } catch (error) {
      console.error('Error saving menu list:', error);
    }
  };

  const handleRenameMenuList = async (list: CreateListFormData) => {
    if (!editingMenuList || !user?.uid) return
    try {
      await updateMenuListName(editingMenuList.id, list.name)
      await loadLists()
    } catch (error) {
      console.error('Error renaming menu list:', error)
    } finally {
      setEditingMenuList(null)
    }
  }

  const handleDeleteMenuList = async (id: string) => {
    try {
      const menuToDelete = menuLists.find(m => m.id === id)
      if (menuToDelete && user?.uid) {
        await moveMenuListToTrash(id, menuToDelete, user.uid)
        setMenuLists(menuLists.filter(list => list.id !== id))
      }
    } catch (error) {
      console.error('Error deleting menu list:', error);
    }
  };

  const handleStopSharingMenuList = async (id: string) => {
    try {
      const menuList = menuLists.find(m => m.id === id)
      if (menuList && user?.uid) {
        const isOwner = menuList.userId === user.uid
        await stopSharingMenuList(id, user.uid, isOwner)
        
        if (isOwner) {
          await loadLists()
        } else {
          setMenuLists(menuLists.filter(m => m.id !== id))
        }
      }
    } catch (error) {
      console.error('Error stopping menu list sharing:', error);
    }
  };




  return (
    <ScreenLayout 
      activeScreen={activeScreen} 
      onNavigate={onNavigate} 
      fabLabel="Lisää uusi ruokalista" 
      showFAB={true} 
      onFABPress={() => setListModalVisible(true)}
    >
      <AdBanner onPress={() => onNavigate('premium')} isPremium={isPremium}/>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : menuLists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={require('../assets/PikkuKokki.png')}
            style={styles.emptyImage}
            resizeMode="contain"
          />
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {menuLists.map((list) => (
              <ListButton
                key={list.id}
                listName={list.name}
                createdAt={list.createdAt}
                ownerAvatar={list.ownerAvatar}
                ownerInitials={list.ownerName?.charAt(0).toUpperCase() || "?"}
                ownerName={list.ownerName}
                sharedUserAvatars={list.sharedUsers}
                isOwnedByUser={list.userId === user?.uid}
                onPress={() => onNavigate('menu-detail', list)}
                onDelete={() => handleDeleteMenuList(list.id)}
                onEdit={() => setEditingMenuList(list)}
                onShare={() => {
                }}
                onStopSharing={() => handleStopSharingMenuList(list.id)}
                onShareComplete={() => loadLists()}
                itemId={list.id}
                itemType="menu"
                editLabel="Muokkaa nimeä"
              />
            ))}
        </ScrollView>
      )}

      <ListModal
        visible={listModalVisible || !!editingMenuList}
        type="menu"
        onClose={() => {
          setListModalVisible(false)
          setEditingMenuList(null)
        }}
        onSave={editingMenuList ? handleRenameMenuList : handleSaveMenuList}
        initialName={editingMenuList?.name}
        title={editingMenuList ? "Muokkaa nimeä" : undefined}
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
  emptyImage: {
    width: 300,
    height: 300,
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
