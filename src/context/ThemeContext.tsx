'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeTokens {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  bgGlass: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentBlue: string;
  accentBlueHover: string;
  accentBlueText: string;
  accentBlueFaint: string;
  borderColor: string;
  borderColorStrong: string;
  colorAdded: string;
  colorAddedBg: string;
  colorAddedBorder: string;
  colorRemoved: string;
  colorRemovedBg: string;
  colorRemovedBorder: string;
  colorModified: string;
  colorModifiedBg: string;
  colorModifiedBorder: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  sidebarWidth: string;
  topNavHeight: string;
}

const lightTokens: ThemeTokens = {
  bgPrimary: '#F8FAFD',
  bgSecondary: '#FFFFFF',
  bgTertiary: '#F3F6FB',
  bgCard: '#FFFFFF',
  bgGlass: 'rgba(255,255,255,0.95)',
  textPrimary: '#111827',
  textSecondary: '#334155',
  textMuted: '#64748B',
  accentBlue: '#1D4ED8',
  accentBlueHover: '#1E40AF',
  accentBlueText: '#FFFFFF',
  accentBlueFaint: 'rgba(29,78,216,0.07)',
  borderColor: '#DCE3EE',
  borderColorStrong: '#C4D0E3',
  colorAdded: '#0F6E3D',
  colorAddedBg: '#ECFDF5',
  colorAddedBorder: '#A7F3D0',
  colorRemoved: '#B91C1C',
  colorRemovedBg: '#FEF2F2',
  colorRemovedBorder: '#FCA5A5',
  colorModified: '#92400E',
  colorModifiedBg: '#FFFBEB',
  colorModifiedBorder: '#FCD34D',
  radiusSm: '4px',
  radiusMd: '8px',
  radiusLg: '12px',
  radiusXl: '16px',
  shadowSm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.04)',
  shadowLg: '0 10px 40px rgba(0,0,0,0.09), 0 4px 12px rgba(0,0,0,0.05)',
  sidebarWidth: '246px',
  topNavHeight: '58px',
};

const darkTokens: ThemeTokens = {
  bgPrimary: '#0C0F1A',
  bgSecondary: '#131828',
  bgTertiary: '#1A2035',
  bgCard: '#131828',
  bgGlass: 'rgba(19,24,40,0.96)',
  textPrimary: '#E4E9F2',
  textSecondary: '#A8B4CC',
  textMuted: '#5C6A88',
  accentBlue: '#3B82F6',
  accentBlueHover: '#60A5FA',
  accentBlueText: '#FFFFFF',
  accentBlueFaint: 'rgba(59,130,246,0.10)',
  borderColor: '#1E2844',
  borderColorStrong: '#2C3A5C',
  colorAdded: '#10B981',
  colorAddedBg: '#052E1C',
  colorAddedBorder: '#065F46',
  colorRemoved: '#EF4444',
  colorRemovedBg: '#1C0A0A',
  colorRemovedBorder: '#7F1D1D',
  colorModified: '#F59E0B',
  colorModifiedBg: '#1C1208',
  colorModifiedBorder: '#92400E',
  radiusSm: '4px',
  radiusMd: '8px',
  radiusLg: '12px',
  radiusXl: '16px',
  shadowSm: '0 1px 3px rgba(0,0,0,0.35)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.40)',
  shadowLg: '0 10px 40px rgba(0,0,0,0.50)',
  sidebarWidth: '234px',
  topNavHeight: '58px',
};

interface ThemeContextValue {
  theme: Theme;
  tokens: ThemeTokens;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') setTheme(saved);
  }, []);

  useEffect(() => {
    const tokens = theme === 'light' ? lightTokens : darkTokens;
    const root = document.documentElement;
    (Object.entries(tokens) as [string, string][]).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  const tokens = theme === 'light' ? lightTokens : darkTokens;

  return (
    <ThemeContext.Provider value={{ theme, tokens, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
