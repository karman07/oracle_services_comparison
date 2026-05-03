'use client';

import { Search, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface SearchFilterBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  count?: number;
  total?: number;
}

export function SearchFilterBar({ value, onChange, placeholder = 'Search…', count, total }: SearchFilterBarProps) {
  const { tokens } = useTheme();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: tokens.bgCard,
          border: `1px solid ${value ? tokens.accentBlue + '60' : tokens.borderColorStrong}`,
          borderRadius: tokens.radiusMd,
          padding: '9px 12px',
          boxShadow: value ? `0 0 0 3px ${tokens.accentBlue}15` : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <Search size={14} color={value ? tokens.accentBlue : tokens.textMuted} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: tokens.textPrimary, fontSize: '13px', fontFamily: 'inherit' }}
        />
        {value && (
          <button onClick={() => onChange('')} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: tokens.textMuted }}>
            <X size={13} />
          </button>
        )}
      </div>
      {count !== undefined && total !== undefined && (
        <span style={{ fontSize: '12px', color: tokens.textMuted, whiteSpace: 'nowrap', fontFamily: 'var(--font-dm-mono), monospace' }}>
          {count.toLocaleString()} / {total.toLocaleString()}
        </span>
      )}
    </div>
  );
}
