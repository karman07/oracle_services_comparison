'use client';

import { useTheme } from '../../context/ThemeContext';
import type { ChangeType } from '../../types/diff.types';

interface BadgeProps {
  type: ChangeType;
  label?: string;
}

export function Badge({ type, label }: BadgeProps) {
  const { tokens } = useTheme();

  const config: Record<ChangeType, { bg: string; color: string; text: string; border: string }> =
    {
      added: {
        bg: tokens.colorAddedBg,
        color: tokens.colorAdded,
        border: tokens.colorAddedBorder,
        text: label ?? 'Added',
      },
      removed: {
        bg: tokens.colorRemovedBg,
        color: tokens.colorRemoved,
        border: tokens.colorRemovedBorder,
        text: label ?? 'Removed',
      },
      modified: {
        bg: tokens.colorModifiedBg,
        color: tokens.colorModified,
        border: tokens.colorModifiedBorder,
        text: label ?? 'Modified',
      },
    };

  const { color, text } = config[type];

  return (
    <span
      style={{
        background: 'transparent',
        color,
        border: `1px solid ${config[type].border}`,
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        padding: '2px 8px',
        borderRadius: tokens.radiusSm,
        textTransform: 'uppercase',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}
