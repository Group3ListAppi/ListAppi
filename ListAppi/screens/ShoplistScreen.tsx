import React, { useEffect, useState } from 'react'
import { StyleSheet, View, ScrollView, Image } from 'react-native'
import { Text, ActivityIndicator } from 'react-native-paper'
import ScreenLayout from '../components/ScreenLayout'
import { AdBanner } from '../components/AdBanner'
import ListModal, { type CreateListFormData } from '../components/ListModal'
import { ListButton } from '../components/ListButton'
import { useAuth } from '../auth/useAuth'

import {
  getUserShoplists,
  saveShoplistToFirestore,
  moveShoplistToTrash,
  updateShoplistName,
  stopSharingShoplist,
  type Shoplist,
} from '../firebase/shoplistUtils'
import { getUserProfiles } from '../firebase/userProfileUtils'

interface ShoplistScreenProps {
  activeScreen: string
  onNavigate: (screen: string, data?: any) => void
}

const ShoplistScreen: React.FC<ShoplistScreenProps> = ({ activeScreen, onNavigate }) => {
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [listModalVisible, setListModalVisible] = useState(false)
  const [editingShoplist, setEditingShoplist] = useState<Shoplist | null>(null)
  const [shoplists, setShoplists] = useState<Shoplist[]>([])

  useEffect(() => {
    if (user?.uid) {
      loadShoplists()
    }
  }, [user?.uid])

  const loadShoplists = async () => {
    if (!user?.uid) return
    try {
      setLoading(true)
      const lists = await getUserShoplists(user.uid)
      
      // Fetch owner profiles for all shoplists
      const ownerIds = [...new Set(lists.map(s => s.userId))]
      const ownerProfiles = await getUserProfiles(ownerIds)
      
      // Fetch shared user profiles
      const allSharedUserIds = new Set<string>()
      lists.forEach(list => {
        list.sharedWith?.forEach(id => allSharedUserIds.add(id))
      })
      const sharedUserProfiles = await getUserProfiles([...allSharedUserIds])
      
      // Enrich shoplists with owner info and shared users
      const enrichedLists = lists.map(shoplist => ({
        ...shoplist,
        ownerName: ownerProfiles.get(shoplist.userId)?.displayName,
        ownerAvatar: ownerProfiles.get(shoplist.userId)?.photoURL,
        sharedUsers: shoplist.sharedWith?.map(uid => ({
          displayName: sharedUserProfiles.get(uid)?.displayName,
          photoURL: sharedUserProfiles.get(uid)?.photoURL,
        })) || [],
      }))
      
      setShoplists(enrichedLists)
    } catch (e) {
      console.error('Error loading shoplists:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateShoplist = async (list: CreateListFormData) => {
    if (!user?.uid) return
    try {
      const id = await saveShoplistToFirestore(list, user.uid)
      const newList: Shoplist = {
        ...list,
        id,
        userId: user.uid,
        createdAt: new Date(),
        sharedWith: [],
        sharedUsers: [],
        ownerName: user.displayName || undefined,
        ownerAvatar: user.photoURL || undefined,
      }
      setShoplists((prev) => [...prev, newList])
    } catch (e) {
      console.error('Error creating shoplist:', e)
    }
  }

  const handleRenameShoplist = async (list: CreateListFormData) => {
    if (!editingShoplist || !user?.uid) return
    try {
      await updateShoplistName(editingShoplist.id, list.name)
      await loadShoplists()
    } catch (e) {
      console.error('Error renaming shoplist:', e)
    } finally {
      setEditingShoplist(null)
    }
  }

  const handleDeleteShoplist = async (id: string) => {
    if (!user?.uid) return
    try {
      const listToDelete = shoplists.find((l) => l.id === id)
      if (!listToDelete) return

      await moveShoplistToTrash(id, listToDelete, user.uid)
      setShoplists((prev) => prev.filter((l) => l.id !== id))
    } catch (e) {
      console.error('Error deleting shoplist:', e)
    }
  }

  const handleStopSharingShoplist = async (id: string) => {
    try {
      const shoplist = shoplists.find(l => l.id === id)
      if (shoplist && user?.uid) {
        const isOwner = shoplist.userId === user.uid
        await stopSharingShoplist(id, user.uid, isOwner)
        
        if (isOwner) {
          await loadShoplists()
        } else {
          setShoplists(shoplists.filter(l => l.id !== id))
        }
      }
    } catch (error) {
      console.error('Error stopping shoplist sharing:', error)
    }
  }

  return (
    <ScreenLayout 
      activeScreen={activeScreen} 
      onNavigate={onNavigate}
      showFAB={true}
      fabLabel="Lisää uusi ostoslista"
      onFABPress={() => setListModalVisible(true)}
    >
      <AdBanner />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : shoplists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={require('../assets/PikkuKokki.png')}
            style={styles.emptyImage}
            resizeMode="contain"
          />
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {shoplists.map((list) => (
            <ListButton
              key={list.id}
              listName={list.name}
              createdAt={list.createdAt}
              ownerAvatar={list.ownerAvatar}
              ownerInitials={list.ownerName?.charAt(0).toUpperCase() || "?"}
              ownerName={list.ownerName}
              sharedUserAvatars={list.sharedUsers}
              isOwnedByUser={list.userId === user?.uid}
              isRecipe={false}
              onPress={() => onNavigate('shoplist-detail', list)}
              onDelete={() => handleDeleteShoplist(list.id)}
              onEdit={() => setEditingShoplist(list)}
              onShare={() => {
              }}
              onStopSharing={() => handleStopSharingShoplist(list.id)}
              onShareComplete={() => loadShoplists()}
              itemId={list.id}
              itemType="shoplist"
              editLabel="Muokkaa nimeä"
            />
          ))}
          <View style={{ height: 140 }} />
        </ScrollView>
      )}

      <ListModal
        visible={listModalVisible || !!editingShoplist}
        type="shopping"
        onClose={() => {
          setListModalVisible(false)
          setEditingShoplist(null)
        }}
        onSave={editingShoplist ? handleRenameShoplist : handleCreateShoplist}
        initialName={editingShoplist?.name}
        title={editingShoplist ? "Muokkaa nimeä" : undefined}
      />
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  description: {
    marginTop: 8,
    marginBottom: 20,
  },
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImage: {
    width: 300,
    height: 300,
  },
})

export default ShoplistScreen