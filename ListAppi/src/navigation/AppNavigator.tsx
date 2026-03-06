// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { TabNavigator } from './TabNavigator';

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      {/* Tässä voisi olla myös Stack.Navigator, jos on esim. Login-sivu erikseen */}
      <TabNavigator />
    </NavigationContainer>
  );
};