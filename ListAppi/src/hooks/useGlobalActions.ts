// src/hooks/useGlobalActions.ts
import { useNavigation } from '@react-navigation/native';
import { ACTION_DEFS } from '../constants/actions';

export const useGlobalActions = () => {
  const navigation = useNavigation();

  const handleLogout = () => {
    console.log("Kirjaudutaan ulos...");
    // Tähän auth-logiikka myöhemmin
  };

  const appBarActions = [
    { ...ACTION_DEFS.trash, onPress: () => navigation.navigate('Trash' as never) },
    { ...ACTION_DEFS.settings, onPress: () => navigation.navigate('Settings' as never) },
    { ...ACTION_DEFS.logout, onPress: handleLogout },
  ];

  return { appBarActions };
};