import React from "react";
import { View, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ModalBaseProps {
  visible: boolean
  onClose: () => void
  title: string
  children?: React.ReactNode
}

export const ModalBase: React.FC<ModalBaseProps> = ({ visible, onClose, title, children }) => {
  const theme = useTheme()

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.touchableOverlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.headerWrapper}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                {title}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <View style={[styles.closeButton, { borderColor: theme.colors.onSurface }]}>
                  <MaterialCommunityIcons
                    name="close"
                    size={16}
                    color={theme.colors.onSurface}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.content}>
              {children}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  touchableOverlay: {
    flex: 1,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },
  headerWrapper: {
    padding: 20,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
})
