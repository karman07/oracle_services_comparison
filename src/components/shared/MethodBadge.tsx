'use client';

import { useTheme } from '../../context/ThemeContext';

// Light-mode bg / text pairs — dark mode handled by darkening the bg via the theme check
const METHOD_LIGHT: Record<string, { bg: string; color: string; border: string }> = {
  GET:     { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  POST:    { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  PUT:     { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  PATCH:   { bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' },
  DELETE:  { bg: '#FEF2F2', color: '#B91C1C', border: '#FCA5A5' },
  HEAD:    { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4' },
  OPTIONS: { bg: '#FEFCE8', color: '#A16207', border: '#FEF08A' },
  TRACE:   { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
};

const METHOD_DARK: Record<string, { bg: string; color: string; border: string }> = {
  GET:     { bg: '#1E3A6E', color: '#93C5FD', border: '#1D4ED8' },
  POST:    { bg: '#14532D', color: '#6EE7B7', border: '#15803D' },
  PUT:     { bg: '#431407', color: '#FDBA74', border: '#C2410C' },
  PATCH:   { bg: '#3B0764', color: '#D8B4FE', border: '#7E22CE' },
  DELETE:  { bg: '#450A0A', color: '#FCA5A5', border: '#B91C1C' },
  HEAD:    { bg: '#042F2E', color: '#5EEAD4', border: '#0F766E' },
  OPTIONS: { bg: '#422006', color: '#FDE68A', border: '#A16207' },
  TRACE:   { bg: '#2E1065', color: '#C4B5FD', border: '#6D28D9' },
};

export function MethodBadge({ method }: { method: string }) {
  const { theme } = useTheme();
  const upper = method.toUpperCase();
  const palette = theme === 'dark' ? METHOD_DARK : METHOD_LIGHT;
  const { bg, color, border } = palette[upper] ?? (theme === 'dark'
    ? { bg: '#1E2844', color: '#94A3B8', border: '#334155' }
    : { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' });

  return (
    <span
      style={{
        background: 'transparent',
        color,
        border: `1px solid ${border}`,
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        padding: '2px 7px',
        borderRadius: '4px',
        fontFamily: 'var(--font-dm-mono), monospace',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {upper}
    </span>
  );
}
