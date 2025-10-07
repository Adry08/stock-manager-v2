"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

type PageColors = {
  primary: string;
  secondary: string;
  accent: string;
};

type PageTheme = {
  dashboard: PageColors;
  stock: PageColors;
  livraison: PageColors;
  vendu: PageColors;
  history: PageColors;
  parametres: PageColors;
};

const lightTheme: PageTheme = {
  dashboard: {
    primary: 'bg-indigo-600',
    secondary: 'bg-indigo-100',
    accent: 'text-indigo-600'
  },
  stock: {
    primary: 'bg-blue-600',
    secondary: 'bg-blue-100',
    accent: 'text-blue-600'
  },
  livraison: {
    primary: 'bg-orange-600',
    secondary: 'bg-orange-100',
    accent: 'text-orange-600'
  },
  vendu: {
    primary: 'bg-green-600',
    secondary: 'bg-green-100',
    accent: 'text-green-600'
  },
  history: {
    primary: 'bg-purple-600',
    secondary: 'bg-purple-100',
    accent: 'text-purple-600'
  },
  parametres: {
    primary: 'bg-gray-600',
    secondary: 'bg-gray-100',
    accent: 'text-gray-600'
  }
};

const darkTheme: PageTheme = {
  dashboard: {
    primary: 'bg-indigo-500',
    secondary: 'bg-indigo-900',
    accent: 'text-indigo-400'
  },
  stock: {
    primary: 'bg-blue-500',
    secondary: 'bg-blue-900',
    accent: 'text-blue-400'
  },
  livraison: {
    primary: 'bg-orange-500',
    secondary: 'bg-orange-900',
    accent: 'text-orange-400'
  },
  vendu: {
    primary: 'bg-green-500',
    secondary: 'bg-green-900',
    accent: 'text-green-400'
  },
  history: {
    primary: 'bg-purple-500',
    secondary: 'bg-purple-900',
    accent: 'text-purple-400'
  },
  parametres: {
    primary: 'bg-gray-500',
    secondary: 'bg-gray-800',
    accent: 'text-gray-400'
  }
};

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  getPageColors: (page: keyof PageTheme) => PageColors;
  currentPage: keyof PageTheme;
  setCurrentPage: (page: keyof PageTheme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [currentPage, setCurrentPage] = useState<keyof PageTheme>('dashboard');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const getPageColors = (page: keyof PageTheme): PageColors => {
    return theme === 'light' ? lightTheme[page] : darkTheme[page];
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, getPageColors, currentPage, setCurrentPage }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}