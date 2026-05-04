'use client';

import { BarChart2, Plus, Minus, RefreshCw, Layers, Download } from 'lucide-react';
import type { ComponentType } from 'react';
import { useTheme } from '../../context/ThemeContext';
import type { DiffResult } from '../../types/diff.types';

export type SectionId = 'summary' | 'all' | 'added' | 'removed' | 'modified' | 'schemas' | 'export';

interface NavItem {
  id: SectionId;
  label: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  count?: number;
}

interface SidebarProps {
  active: SectionId;
  onNavigate: (id: SectionId) => void;
  diffResult: DiffResult | null;
}

export function Sidebar({ active, onNavigate, diffResult }: SidebarProps) {
  const { tokens } = useTheme();

  const navItems: NavItem[] = [
    { id: 'summary',  label: 'Summary',        icon: BarChart2 },
    { id: 'all',      label: 'All APIs',        icon: RefreshCw, count: diffResult?.pathDiffs.length },
    { id: 'added',    label: 'Added APIs',      icon: Plus,      count: diffResult?.summary.pathsAdded },
    { id: 'removed',  label: 'Removed APIs',    icon: Minus,     count: diffResult?.summary.pathsRemoved },
    { id: 'modified', label: 'Modified APIs',   icon: RefreshCw, count: diffResult?.summary.pathsModified },
    { id: 'schemas',  label: 'Schema Changes',  icon: Layers,    count: diffResult?.schemaDiffs.length },
    { id: 'export',   label: 'Export',          icon: Download },
  ];

  const disabled = !diffResult;

  return (
    <nav
      style={{
        width: tokens.sidebarWidth,
        flexShrink: 0,
        background: tokens.bgSecondary,
        borderRight: `1px solid ${tokens.borderColor}`,
        padding: '18px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          padding: '4px 10px 10px',
          marginBottom: '6px',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.09em', color: tokens.textMuted, textTransform: 'uppercase' }}>
          Navigation
        </span>
      </div>

      {navItems.map((item) => {
        const isActive = active === item.id;
        const isDisabled = disabled && item.id !== 'summary';
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => !isDisabled && onNavigate(item.id)}
            disabled={isDisabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '10px 10px',
              borderRadius: tokens.radiusMd,
              border: isActive ? `1px solid ${tokens.accentBlue}35` : `1px solid ${tokens.bgSecondary}`,
              background: isActive ? tokens.accentBlueFaint : 'transparent',
              color: isActive ? tokens.accentBlue : isDisabled ? tokens.textMuted : tokens.textSecondary,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: isActive ? 700 : 600,
              width: '100%',
              textAlign: 'left',
              opacity: isDisabled ? 0.4 : 1,
              transition: 'background 0.12s, border-color 0.12s, box-shadow 0.12s',
              boxShadow: isActive ? tokens.shadowSm : 'none',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: tokens.radiusSm,
                background: isActive ? `${tokens.accentBlue}18` : tokens.bgTertiary,
                border: `1px solid ${isActive ? `${tokens.accentBlue}40` : tokens.borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={15} color={isActive ? tokens.accentBlue : tokens.textMuted} />
            </div>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <span
                style={{
                  background: isActive ? tokens.accentBlue : tokens.borderColor,
                  color: isActive ? tokens.accentBlueText : tokens.textMuted,
                  border: `1px solid ${isActive ? tokens.accentBlue : tokens.borderColorStrong}`,
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '99px',
                  minWidth: '20px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-dm-mono), monospace',
                }}
              >
                {item.count > 9999 ? '9999+' : item.count.toLocaleString()}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
