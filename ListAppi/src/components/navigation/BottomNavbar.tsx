// src/components/navigation/BottomNavbar.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, IconButton, Text, useTheme } from 'react-native-paper';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export const BottomNavbar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const theme = useTheme();

  return (
    <Surface style={[styles.navbar, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <View style={styles.navItemsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Määritellään ikonit reitin nimen perusteella
          const getIcon = () => {
            switch (route.name) {
              case 'Home': return 'home';
              case 'Menu': return 'silverware-fork-knife';
              case 'Recipes': return 'book-open-variant';
              case 'Shoplist': return 'cart';
              case 'Account': return 'account-circle';
              default: return 'help-circle';
            }
          };

          return (
            <View key={route.key} style={styles.navItem}>
              <IconButton
                icon={getIcon()}
                size={24}
                iconColor={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant}
                style={[
                  styles.iconButton,
                  isFocused && { backgroundColor: theme.colors.primaryContainer }
                ]}
                onPress={onPress}
              />
              <Text
                variant="labelSmall"
                style={{ color: isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant }}
              >
                {options.title ?? route.name}
              </Text>
            </View>
          );
        })}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingBottom: 25, // Huomioi nykyaikaisten puhelinten alareunan "palkki"
  },
  navItemsContainer: { flexDirection: 'row', flex: 1 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconButton: { margin: 0 },
});