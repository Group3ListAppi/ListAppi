// src/navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomNavbar } from '../components/navigation/BottomNavbar';
import { TopAppBar } from '../components/navigation/TopAppBar';

// Valmiit screenit (nämä pitää luoda screens-kansioon)
import { HomeScreen } from '../screens/home/HomeScreen';
import { MenuScreen } from '../screens/menu/MenuScreen';
import { RecipeScreen } from '../screens/recipe/RecipeScreen';
import { ShoplistScreen } from '../screens/shoplist/ShoplistScreen';
import { AccountScreen } from '../screens/accountsettings/AccountScree';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      id="MainTabs"
      tabBar={(props) => <BottomNavbar {...props} />}
        screenOptions={({ navigation, route }) => ({
          header: ({ options }) => {
            // Tarkistetaan, onko navigaattorilla "oikeaa" historiaa (Stack-taso)
            // vai ollaanko vain siirrytty Tabista toiseen.
            const canGoBack = navigation.canGoBack();

            // Piilotetaan nuoli kaikilta pää-tabeilta:
            const isTabScreen = ['Home', 'Menu', 'Recipes', 'Shoplist', 'Account'].includes(route.name);
        
            return (
              <TopAppBar 
                title={options.title ?? route.name}
                // Näytetään nuoli vain jos EI olla pää-tabissa JA canGoBack on true
                onBack={(!isTabScreen && canGoBack) ? navigation.goBack : undefined}
                // TÄRKEÄ: options.onMenuPress tulee nyt suoraan sivulta (setOptions)
                onMenuPress={(options as any).onMenuPress}
                onNotifications={() => navigation.navigate('Notifications')}
              />
            );
          },
        })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Etusivu' }} />
      <Tab.Screen name="Menu" component={MenuScreen} options={{ title: 'Ruokalistat' }} />
      <Tab.Screen name="Recipes" component={RecipeScreen} options={{ title: 'Reseptit' }} />
      <Tab.Screen name="Shoplist" component={ShoplistScreen} options={{ title: 'Ostoslistat' }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Profiili' }} />
    </Tab.Navigator>
  );
};