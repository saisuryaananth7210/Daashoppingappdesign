import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Theme = 'orange' | 'white';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    primary: string;
    primaryHover: string;
    accent: string;
    cardBg: string;
    pageBg: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('orange');

  const colors = theme === 'orange' 
    ? {
        primary: '#FF6B00',
        primaryHover: '#C84C0C',
        accent: '#D4AF37',
        cardBg: '#1A1A1A',
        pageBg: '#0D0D0D',
      }
    : {
        primary: '#FFFFFF',
        primaryHover: '#E5E5E5',
        accent: '#000000',
        cardBg: '#F5F5F5',
        pageBg: '#000000',
      };

  const toggleTheme = () => {
    setTheme(prev => prev === 'orange' ? 'white' : 'orange');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
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
