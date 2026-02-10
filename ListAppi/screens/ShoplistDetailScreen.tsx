import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { Text, TextInput, ActivityIndicator, useTheme } from 'react-native-paper'
import ScreenLayout from '../components/ScreenLayout'
import { AdBanner } from '../components/AdBanner'
import { useAuth } from '../auth/useAuth'
import { ListItem } from '../components/ListItem'
import type { Shoplist } from '../firebase/shoplistUtils'
import { MaterialCommunityIcons } from "@expo/vector-icons"
import {
  addShoplistItem,
  addShoplistItemHistoryEntries,
  deleteShoplistItem,
  deleteCheckedShoplistItems,
  getShoplistItems,
  setShoplistItemChecked,
  type ShoplistItem,
} from '../firebase/shoplistItemUtils'
import { getShoplistItemHistory } from '../firebase/shoplistItemUtils'

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
  const [doneCollapsed, setDoneCollapsed] = useState(true)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

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

  const loadPurchaseHistory = async () => {
    if (!user?.uid) return
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const history = await getShoplistItemHistory(user.uid, thirtyDaysAgo)
      
      const countMap = new Map<string, string>()
      history.forEach((item) => {
        const normalized = item.normalizedText || item.text.toLowerCase().trim()
        if (!countMap.has(normalized)) {
          countMap.set(normalized, item.text)
        }
      })
      
      const topItems = Array.from(countMap.values()).slice(0, 10)
      setSuggestions(topItems)
    } catch (error) {
      console.error('Error loading purchase history:', error)
    }
  }

  useEffect(() => {
    loadPurchaseHistory()
  }, [user?.uid])

  const activeItems = useMemo(() => items.filter(i => !i.checked), [items])
  const doneItems = useMemo(() => items.filter(i => i.checked), [items])
  const itemsDone = doneItems.length
  const itemsTotal = items.length

  const handleAdd = async () => {
    const value = text.trim()
    if (!value) return
    setText('')

    try {
      await addShoplistItem(shoplist.id, value, user?.uid ?? null)
      await loadItems()
    } catch (e) {
      console.error('Error adding item:', e)
      // palauta teksti kenttään virheessä
      // setText(value)
    }
  }

  const handleTextChange = (newText: string) => {
    setText(newText)
    
    if (newText.trim().length > 0) {
      const filtered = suggestions.filter(item =>
        item.toLowerCase().includes(newText.toLowerCase())
      )
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSelectSuggestion = (suggestion: string) => {
    setText(suggestion)
    setShowSuggestions(false)
  }

  const toggleChecked = async (itemId: string, next: boolean) => {
    const targetItem = items.find((item) => item.id === itemId)
    // Optimistinen UI
    setItems(prev => prev.map(i => (i.id === itemId ? { ...i, checked: next } : i)))

    try {
      await setShoplistItemChecked(shoplist.id, itemId, next)
      if (next && user?.uid && targetItem?.text) {
        await addShoplistItemHistoryEntries(user.uid, shoplist.id, [
          { text: targetItem.text },
        ])
      }
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

  const removeCheckedItems = () => {
  if (doneItems.length === 0) return

  Alert.alert(
    "Poistetaanko ostetut tuotteet?",
    `Olet poistamassa ${doneItems.length} tuotetta pysyvästi tältä listalta.`,
    [
      {
        text: "Peruuta",
        style: "cancel",
      },
      {
        text: "Poista",
        style: "destructive",
        onPress: async () => {
          const backup = items

          // Optimistinen UI
          setItems(prev => prev.filter(i => !i.checked))

          try {
            await deleteCheckedShoplistItems(shoplist.id)
          } catch (e) {
            console.error("Error removing checked items:", e)
            setItems(backup) // rollback jos epäonnistuu
          }
        },
      },
    ],
    { cancelable: true }
  )
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

      <View style={styles.inputContainer}>
        <View style={styles.addRow}>
          <TextInput
            mode="outlined"
            placeholder="Lisää tuote…"
            value={text}
            onChangeText={handleTextChange}
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

        {showSuggestions && text.trim().length > 0 && (
          <ScrollView style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]} scrollEnabled={true}>
            {suggestions
              .filter(item => item.toLowerCase().includes(text.toLowerCase()))
              .map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSelectSuggestion(suggestion)}
                  style={[styles.suggestionItem, { borderBottomColor: theme.colors.outlineVariant }]}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: theme.colors.onSurface, fontSize: 16 }}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        )}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : (
        <>
          <ScrollView style={styles.list}>
            {activeItems.map((item) => (
              <ListItem
                key={item.id}
                title={item.quantity && item.quantity > 1 ? `${item.quantity}kpl ${item.text}` : item.text}
                isChecked={item.checked}
                onCheckChange={(next) => toggleChecked(item.id, next)}
                onLongPress={() => removeItem(item.id)}
                delayLongPress={700}
              />
            ))}

            {itemsDone > 0 && (
              <TouchableOpacity
                onPress={() => setDoneCollapsed(v => !v)}
                style={[styles.doneHeader, { borderColor: theme.colors.outlineVariant }]}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={{ color: theme.colors.onSurfaceVariant, fontWeight: "700" }}>
                    Tehdyt ({itemsDone})
                  </Text>

                  {/* pikatoiminto: poista kaikki ostetut */}
                  <TouchableOpacity
                    onPress={removeCheckedItems}
                    activeOpacity={0.7}
                    style={[styles.clearDoneBtn, { borderColor: theme.colors.outlineVariant }]}
                  >
                    <Text style={{ color: theme.colors.onSurfaceVariant, fontWeight: "700" }}>
                      Poista
                    </Text>
                  </TouchableOpacity>
                </View>

                <MaterialCommunityIcons
                  name={doneCollapsed ? "chevron-down" : "chevron-up"}
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            )}

            {!doneCollapsed && doneItems.map((item) => (
              <ListItem
                key={item.id}
                title={item.quantity && item.quantity > 1 ? `${item.quantity}kpl ${item.text}` : item.text}
                isChecked={item.checked}
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
  inputContainer: {
    marginBottom: 8,
  },
  addRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
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
  doneHeader: {
  marginTop: 8,
  marginHorizontal: 16,
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 8,
  borderWidth: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  },
  clearDoneBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  suggestionsContainer: {
    maxHeight: 240,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
})

export default ShoplistDetailScreen