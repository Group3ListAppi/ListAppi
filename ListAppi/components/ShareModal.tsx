import React, { useState, useEffect, useRef  } from "react";
import { View, StyleSheet, ScrollView} from "react-native";
import { useTheme } from "react-native-paper";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ModalBase } from "./ModalBase";
import { SubmitButton } from "./SubmitButton";
import { TouchableOpacity } from "react-native";
import { Input } from "./Input";

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
}

export const ShareModal: React.FC<ActionModalProps> = ({ visible, onClose, title }) => {
  const theme = useTheme()
  const [emails, setEmails] = useState<string[]>([""])
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

  useEffect(() => {
    if (!visible) {
      setEmails([""])
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
      <SubmitButton text="Lähetä kutsu" onPress={() => console.log('Send invitations')} />
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
})