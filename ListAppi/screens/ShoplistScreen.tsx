import React, { useEffect, useState } from 'react'
import { StyleSheet, View, ScrollView } from 'react-native'
import { Text, ActivityIndicator } from 'react-native-paper'
import ScreenLayout from '../components/ScreenLayout'
import ListModal, { type CreateListFormData } from '../components/ListModal'
import { ListButton } from '../components/ListButton'
import { useAuth } from '../auth/useAuth'

import {
  getUserShoplists,
  saveShoplistToFirestore,
  moveShoplistToTrash,
  type Shoplist,
} from '../firebase/shoplistUtils'

interface ShoplistScreenProps {
  activeScreen: string
  onNavigate: (screen: string, data?: any) => void
}

const ShoplistScreen: React.FC<ShoplistScreenProps> = ({ activeScreen, onNavigate }) => {
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [listModalVisible, setListModalVisible] = useState(false)
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
      setShoplists(lists)
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
      }
      setShoplists((prev) => [...prev, newList])
    } catch (e) {
      console.error('Error creating shoplist:', e)
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

  return (
    <ScreenLayout 
      activeScreen={activeScreen} 
      onNavigate={onNavigate}
      showFAB={true}
      fabLabel="Lisää uusi ostoslista"
      onFABPress={() => setListModalVisible(true)}
    >
      

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : shoplists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodyMedium">Ei vielä ostoslistoja.</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {shoplists.map((list) => (
            <ListButton
              key={list.id}
              listName={list.name}
              createdAt={list.createdAt}
              ownerAvatar={user?.photoURL || undefined}
              ownerInitials={user?.displayName?.charAt(0).toUpperCase() || "U"}
              isRecipe={false}
              onPress={() => onNavigate('shoplist-detail', list)}
              onDelete={() => handleDeleteShoplist(list.id)}
              onEdit={() => onNavigate('shoplist-detail', list)}
              onShare={() => {
                // TODO: jako myöhemmin
              }}
              customActionIds={['share', 'edit', 'remove']}
            />
          ))}
          <View style={{ height: 140 }} />
        </ScrollView>
      )}

      <ListModal
        visible={listModalVisible}
        type="shopping"
        onClose={() => setListModalVisible(false)}
        onSave={handleCreateShoplist}
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
    marginTop: 12,
  },
})

export default ShoplistScreen