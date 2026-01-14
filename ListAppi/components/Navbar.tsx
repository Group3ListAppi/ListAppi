import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, IconButton, Text, useTheme, Badge } from 'react-native-paper';

interface NavbarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeScreen, onNavigate }) => {
  const theme = useTheme()
  
  const navItems = [
    { key: 'home', label: 'Koti', icon: 'home' },
    { key: 'menu', label: 'Ruokalistat', icon: 'silverware-fork-knife' },
    { key: 'recipes', label: 'Reseptit', icon: 'book-open-variant' },
    { key: 'shoplist', label: 'Ostoslista', icon: 'cart' },
  ]

  return (
    <Surface style={[styles.navbar, { backgroundColor: theme.colors.surface }]}>
      {navItems.map((item) => (
        <View key={item.key} style={styles.navItem}>
          <IconButton
            icon={item.icon}
            size={24}
            iconColor={activeScreen === item.key ? theme.colors.primary : theme.colors.onSurfaceVariant}
            style={[
              styles.iconButton,
              activeScreen === item.key && { backgroundColor: theme.colors.primaryContainer }
            ]}
            onPress={() => onNavigate(item.key)}
          />
          <Text
            variant="labelSmall"
            style={[
              styles.navLabel,
              {
                color: activeScreen === item.key ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
            ]}
          >
            {item.label}
          </Text>
        </View>
      ))}
    </Surface>
  )
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingBottom: 50,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    marginBottom: 0,
  },
  navLabel: {
    textAlign: 'center',
    marginTop: 2,
    fontSize: 11,
  },
})

export default Navbar;
