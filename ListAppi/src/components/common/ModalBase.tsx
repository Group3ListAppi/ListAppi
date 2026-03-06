// src/components/common/ModalBase.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Portal, Text, IconButton, useTheme } from 'react-native-paper';

interface ModalBaseProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const ModalBase: React.FC<ModalBaseProps> = ({ visible, onClose, title, children }) => {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        // contentContainerStyle määrittää nyt sijainnin alhaalla
        contentContainerStyle={[
          styles.bottomSheet,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <View style={styles.dragHandle} /> 
        {title && <Text variant="titleMedium" style={styles.title}>{title}</Text>}
        <View style={styles.content}>{children}</View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40, // Tilaa alareunan "palkille"
    paddingHorizontal: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  content: { paddingBottom: 16 }
});