import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native'
import { Text, TextInput, ActivityIndicator, useTheme } from 'react-native-paper'
import ScreenLayout from '../components/ScreenLayout'
import { AdBanner } from '../components/AdBanner'
import { useAuth } from '../auth/useAuth'
import { ListItem } from '../components/ListItem'
import type { Shoplist } from '../firebase/shoplistUtils'
import {
  addShoplistItem,
  deleteShoplistItem,
  getShoplistItems,
  setShoplistItemChecked,
  type ShoplistItem,
} from '../firebase/shoplistItemUtils'

interface ShoplistDetailScreenProps {
  shoplist: Shoplist
  activeScreen: string
  onNavigate: (screen: string, data?: any) => void
  onBack: () => void
  isPremium?: boolean;
}

const ShoplistDetailScreen: React.FC<ShoplistDetailScreenProps> = ({ activeScreen, onNavigate, onBack, shoplist, isPremium }) => {
  const theme = useTheme()
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ShoplistItem[]>([])
  const [text, setText] = useState('')

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoplist.id])

  const loadItems = async () => {
    try {
      setLoading(true)
      const data = await getShoplistItems(shoplist.id)
      setItems(data)
    } catch (e) {
      console.error('Error loading shoplist items:', e)
    } finally {
      setLoading(false)
    }
  }

  const itemsDone = useMemo(() => items.filter(i => i.checked).length, [items])
  const itemsTotal = items.length

  const handleAdd = async () => {
    const value = text.trim()
    if (!value) return
    setText('')

    try {
      const id = await addShoplistItem(shoplist.id, value, user?.uid ?? null)

      // Optimistinen lisäys UI:hin (UI päivitetään heti ennen kuin Firestore on vastannut)
      setItems(prev => [
        ...prev,
        { id, text: value, checked: false, createdAt: new Date() },
      ])
    } catch (e) {
      console.error('Error adding item:', e)
      // palauta teksti kenttään virheessä
      // setText(value)
    }
  }

  const toggleChecked = async (itemId: string, next: boolean) => {
    // Optimistinen UI
    setItems(prev => prev.map(i => (i.id === itemId ? { ...i, checked: next } : i)))

    try {
      await setShoplistItemChecked(shoplist.id, itemId, next)
    } catch (e) {
      console.error('Error toggling item:', e)
      // rollback
      setItems(prev => prev.map(i => (i.id === itemId ? { ...i, checked: !next } : i)))
    }
  }

  const removeItem = async (itemId: string) => {
    // Optimistinen UI
    const backup = items
    setItems(prev => prev.filter(i => i.id !== itemId))

    try {
      await deleteShoplistItem(shoplist.id, itemId)
    } catch (e) {
      console.error('Error deleting item:', e)
      setItems(backup)
    }
  }

  return (
    <ScreenLayout
      activeScreen={activeScreen}
      onNavigate={onNavigate}
      showNav={false}
      showBack={true}
      onBack={onBack}
      hideActions={true}
      customTitle={shoplist.name}
    >
      <Text variant="bodyMedium" style={styles.subtitle}>
        {itemsDone}/{itemsTotal} tehty
      </Text>

      <View style={styles.addRow}>
        <TextInput
          mode="outlined"
          placeholder="Lisää tuote…"
          value={text}
          onChangeText={setText}
          style={styles.input}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={handleAdd}
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.8}
        >
          <Text style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>Lisää</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : (
        <>
          <ScrollView style={styles.list}>
              {items.map((item) => (
                  <ListItem
                      key={item.id}
                      title={item.text}
                      isChecked={item.checked}
                      //onPress={() => toggleChecked(item.id, !item.checked)}
                      onCheckChange={(next) => toggleChecked(item.id, next)}
                      onLongPress={() => removeItem(item.id)}
                      delayLongPress={700}
                  />
              ))}
              <View style={{ height: 180 }} />
          </ScrollView>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <AdBanner onPress={() => onNavigate('premium')} isPremium={isPremium}/>
          </View>
        </>
      )}
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: 8,
    marginBottom: 12,
  },
  addRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 10,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
})

export default ShoplistDetailScreen