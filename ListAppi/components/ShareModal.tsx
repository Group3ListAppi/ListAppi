import React, { useState, useEffect, useRef  } from "react";
import { View, StyleSheet, ScrollView, Alert} from "react-native";
import { useTheme } from "react-native-paper";
import { Text, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ModalBase } from "./ModalBase";
import { SubmitButton } from "./SubmitButton";
import { TouchableOpacity } from "react-native";
import { Input } from "./Input";
import { sendInvitation } from "../firebase/invitationUtils";
import { useAuth } from "../auth/useAuth";

export interface ActionButton {
  id: string
  label: string
  onPress: () => void
  icon?: string
}

interface ActionModalProps {
  visible: boolean
  onClose: () => void
  title: string
  itemId?: string
  itemIds?: string[]
  itemType?: 'recipe' | 'recipeCollection' | 'shoplist' | 'menu'
  onShareComplete?: () => void
}

export const ShareModal: React.FC<ActionModalProps> = ({ visible, onClose, title, itemId, itemIds, itemType, onShareComplete }) => {
  const theme = useTheme()
  const { user } = useAuth()
  const [emails, setEmails] = useState<string[]>([""])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const handleAddEmail = () => {
    setEmails([...emails, ""])
  }

  const handleEmailChange = (index: number, text: string) => {
    const newEmails = [...emails]
    newEmails[index] = text
    setEmails(newEmails)
  }

  const handleRemoveEmail = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index)
      setEmails(newEmails)
    }
  }

  const handleSendInvitations = async () => {
    console.log('handleSendInvitations called', { user: !!user, itemId, itemIds, itemType })
    
    if (!user || !itemType) {
      Alert.alert('Virhe', `Kohteen tiedot puuttuvat. itemType: ${itemType}`)
      return
    }

    const validEmails = emails.filter(email => email.trim().length > 0)
    
    if (validEmails.length === 0) {
      Alert.alert('Virhe', 'Lisää vähintään yksi sähköpostiosoite')
      return
    }

    setLoading(true)
    const results: { email: string; success: boolean; error?: string }[] = []

    const targetIds = itemIds && itemIds.length > 0 ? itemIds : (itemId ? [itemId] : [])
    
    if (targetIds.length === 0) {
      Alert.alert('Virhe', 'Kohteen tiedot puuttuvat')
      setLoading(false)
      return
    }

    // Fetch item names if sharing recipes
    const itemNames: { [key: string]: string } = {}
    if (itemType === 'recipe' && targetIds.length > 0) {
      const { getRecipesByIds } = await import('../firebase/recipeUtils')
      const recipes = await getRecipesByIds(targetIds)
      recipes.forEach(recipe => {
        itemNames[recipe.id] = recipe.title
      })
    }

    for (const email of validEmails) {
      for (const id of targetIds) {
        try {
          const itemName = itemType === 'recipe' && itemNames[id] ? itemNames[id] : title
          await sendInvitation(
            user.uid,
            user.email || '',
            user.displayName || undefined,
            email.trim(),
            id,
            itemType,
            itemName
          )
          results.push({ email, success: true })
        } catch (error: any) {
          results.push({ email, success: false, error: error.message })
        }
      }
    }

    setLoading(false)

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    if (successCount > 0 && failCount === 0) {
      Alert.alert('Onnistui!', `${successCount} kutsua lähetetty`)
      onShareComplete?.()
      onClose()
    } else if (successCount > 0 && failCount > 0) {
      const failedEmails = results.filter(r => !r.success)
        .map(r => `${r.email}: ${r.error}`).join('\n')
      Alert.alert(
        'Osittain onnistui',
        `${successCount} kutsua lähetetty\n${failCount} epäonnistui:\n${failedEmails}`
      )
    } else {
      const failedEmails = results.filter(r => !r.success)
        .map(r => `${r.email}: ${r.error}`).join('\n')
      Alert.alert('Virhe', `Kutsujen lähettäminen epäonnistui:\n${failedEmails}`)
    }
  }

  useEffect(() => {
    if (!visible) {
      setEmails([""])
      setLoading(false)
    }
  }, [visible])

  return (
    <ModalBase visible={visible} onClose={onClose} title={title}>
        <ScrollView 
          style={styles.emailsContainer}
          keyboardShouldPersistTaps="always"
          onStartShouldSetResponderCapture={() => true}
          showsVerticalScrollIndicator={true}
          scrollIndicatorInsets={{ right: -10 }}
          indicatorStyle="white"
        >
          {emails.map((email, index) => (
            <View key={index} style={styles.emailRow}>
              <View style={styles.inputWrapper}>
                <Input
                  label="ystava@esimerkki.com"
                  placeholder=""
                  value={email}
                  onChangeText={(text) => handleEmailChange(index, text)}
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
              {emails.length > 1 && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleRemoveEmail(index)}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={24}
                    color={theme.colors.error}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      <View>
        <TouchableOpacity style={styles.addRow} onPress={handleAddEmail}>
          <MaterialCommunityIcons
            name="plus"
            size={24}
            color={theme.colors.onSurface}
          />
          <Text style={[{ color: theme.colors.onSurface }, styles.addText]}>
            Lisää uusi sähköposti
          </Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <SubmitButton text="Lähetä kutsu" onPress={handleSendInvitations} />
      )}
    </ModalBase>
  )
}

const styles = StyleSheet.create({
  emailsContainer: {
    maxHeight: 300,
    marginBottom: 16,
    paddingRight: 5,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    marginBottom: 16,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addText: {
    fontSize: 16,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
})