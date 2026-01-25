import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export type ThemeKey = 'dark' | 'light' | 'blue' | 'purple'

// Tumma teema vihreillä aksenteilla (alkuperäinen)
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    surface: '#2C2C2C',
    primary: '#4CAF50',
    primaryContainer: '#A5D6A7',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#FFFFFF',
    background: '#1E1E1E',
    outline: '#444444',
  },
}

// Vaalea teema vihreillä aksenteilla
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    surface: '#FFFFFF',
    primary: '#4CAF50',
    primaryContainer: '#C8E6C9',
    onSurface: '#000000',
    onSurfaceVariant: '#5F6368',
    background: '#F5F5F5',
    outline: '#DDDDDD',
  },
}

// Tumma teema sinisillä aksenteilla
const blueTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    surface: '#2C2C2C',
    primary: '#2196F3',
    primaryContainer: '#90CAF9',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#FFFFFF',
    background: '#1E1E1E',
    outline: '#444444',
  },
}

// Tumma teema violeteilla aksenteilla
const purpleTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    surface: '#2C2C2C',
    primary: '#9C27B0',
    primaryContainer: '#CE93D8',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#FFFFFF',
    background: '#1E1E1E',
    outline: '#444444',
  },
}

export const themes = {
  dark: darkTheme,
  light: lightTheme,
  blue: blueTheme,
  purple: purpleTheme,
}

// Oletuksena tumma teema
export default darkTheme
