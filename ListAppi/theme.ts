import { MD3LightTheme } from 'react-native-paper';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    surface: '#2C2C2C', // Navbarin tausta
    primary: '#4CAF50', // Pääväri (aktiivinen ikoni ja teksti)
    primaryContainer: '#A5D6A7',  // Aktiivisen ikoni tausta
    onSurface: '#FFFFFF', // Tekstin väri
    onSurfaceVariant: '#FFFFFF', // Interaktiiviset ikonit ja tekstit
    background: '#1E1E1E', // Taustan väri
  },
}

export default theme
