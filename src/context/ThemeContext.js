import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../theme/colors';

const THEME_STORAGE_KEY = '@cheta_user_theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme(); // 'light' or 'dark'
  const [themeMode, setThemeMode] = useState('system'); // 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState(systemColorScheme === 'dark' ? darkTheme : lightTheme);

  useEffect(() => {
    loadSavedTheme();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      setTheme(systemColorScheme === 'dark' ? darkTheme : lightTheme);
    } else {
      setTheme(themeMode === 'dark' ? darkTheme : lightTheme);
    }
  }, [themeMode, systemColorScheme]);

  const loadSavedTheme = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode) {
        setThemeMode(savedMode);
      }
    } catch (err) {
      console.error('Failed to load theme preference', err);
    }
  };

  const toggleTheme = async (mode) => {
    // mode can be 'light', 'dark', or 'system'
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.error('Failed to save theme preference', err);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);