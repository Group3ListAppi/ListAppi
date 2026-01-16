import React, { useState, useEffect, useRef  } from "react";
import { View, StyleSheet, TextInput, ScrollView} from "react-native";
import { useTheme } from "react-native-paper";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ModalBase } from "./ModalBase";
import { SubmitButton } from "./SubmitButton";
import { TouchableOpacity } from "react-native";

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
            <TextInput
              key={index}
              style={[styles.input, { marginBottom: index < emails.length - 1 ? 12 : 0 }]}
              placeholder="ystava@esimerkki.com"
              value={email}
              onChangeText={(text) => handleEmailChange(index, text)}
              autoCorrect={false}
              keyboardType="email-address"
            />
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
    maxHeight: 200,
    marginBottom: 16,
    paddingRight: 5,
  },
  input: {
    height: 40,
    backgroundColor: 'white',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  addText: {
    fontSize: 16,
  },
})