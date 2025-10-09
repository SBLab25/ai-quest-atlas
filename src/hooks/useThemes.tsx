import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export type ThemeOption = {
  id: string;
  name: string;
  description: string;
  className: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
};

export const themeOptions: ThemeOption[] = [
  {
    id: 'default',
    name: 'Discovery',
    description: 'The classic Discovery Atlas theme',
    className: '',
    colors: {
      primary: 'hsl(261, 86%, 55%)',
      secondary: 'hsl(0, 100%, 85%)',
      accent: 'hsl(201, 59%, 60%)',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool blues and ocean vibes',
    className: 'theme-ocean',
    colors: {
      primary: 'hsl(210, 100%, 50%)',
      secondary: 'hsl(210, 100%, 85%)',
      accent: 'hsl(180, 60%, 60%)',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural greens and earth tones',
    className: 'theme-forest',
    colors: {
      primary: 'hsl(120, 60%, 40%)',
      secondary: 'hsl(120, 50%, 80%)',
      accent: 'hsl(110, 50%, 60%)',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm oranges and golden hues',
    className: 'theme-sunset',
    colors: {
      primary: 'hsl(15, 100%, 60%)',
      secondary: 'hsl(15, 100%, 85%)',
      accent: 'hsl(25, 80%, 70%)',
    },
  },
  {
    id: 'purple',
    name: 'Purple',
    description: 'Rich purples and magentas',
    className: 'theme-purple',
    colors: {
      primary: 'hsl(280, 100%, 60%)',
      secondary: 'hsl(280, 80%, 85%)',
      accent: 'hsl(270, 70%, 75%)',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Elegant pinks and roses',
    className: 'theme-rose',
    colors: {
      primary: 'hsl(330, 80%, 60%)',
      secondary: 'hsl(330, 70%, 85%)',
      accent: 'hsl(340, 60%, 75%)',
    },
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    description: 'Deep space purples and blues',
    className: 'theme-cosmic',
    colors: {
      primary: 'hsl(250, 100%, 70%)',
      secondary: 'hsl(250, 80%, 85%)',
      accent: 'hsl(270, 70%, 80%)',
    },
  },
];

export const useThemes = () => {
  const { theme: mode, setTheme: setMode } = useTheme();
  const [currentTheme, setCurrentTheme] = useState('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('selected-theme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (themeId: string) => {
    const themeOption = themeOptions.find(t => t.id === themeId);
    if (!themeOption) return;

    // Remove all theme classes
    themeOptions.forEach(t => {
      if (t.className) {
        document.documentElement.classList.remove(t.className);
      }
    });

    // Apply new theme class
    if (themeOption.className) {
      document.documentElement.classList.add(themeOption.className);
    }
  };

  const setTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem('selected-theme', themeId);
  };

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return {
    currentTheme,
    setTheme,
    themeOptions,
    mode,
    setMode,
    toggleMode,
    mounted,
  };
};