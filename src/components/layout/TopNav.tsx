'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function TopNav() {
  const { tokens, theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        height: tokens.topNavHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: tokens.bgSecondary,
        borderBottom: `1px solid ${tokens.borderColor}`,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 20,
        boxShadow: tokens.shadowSm,
      }}
    >
      {/* Text-only wordmark — no icon */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span
          style={{
            fontSize: '17px',
            fontWeight: 800,
            color: tokens.accentBlue,
            letterSpacing: '-0.3px',
            lineHeight: 1,
          }}
        >
          Intellinum
        </span>
        <span
          style={{
            fontSize: '17px',
            fontWeight: 400,
            color: tokens.textSecondary,
            letterSpacing: '-0.2px',
            lineHeight: 1,
          }}
        >
          Comparison
        </span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: tokens.textMuted,
            fontFamily: 'var(--font-dm-mono), monospace',
            marginLeft: '4px',
            padding: '2px 7px',
            borderRadius: '99px',
            border: `1px solid ${tokens.borderColor}`,
            background: tokens.bgTertiary,
          }}
        >
          25C → 26B
        </span>
      </div>

      <button
        onClick={toggleTheme}
        aria-label="Toggle colour theme"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '34px',
          height: '34px',
          borderRadius: tokens.radiusMd,
          border: `1px solid ${tokens.borderColor}`,
          background: tokens.bgTertiary,
          color: tokens.textSecondary,
          cursor: 'pointer',
        }}
      >
        {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
      </button>
    </header>
  );
}
