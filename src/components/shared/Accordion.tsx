'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface AccordionProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
}

export function Accordion({ title, children, defaultOpen = false, badge }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { tokens } = useTheme();
  const toggle = () => setOpen((o) => !o);

  return (
    <div
      style={{
        borderBottom: `1px solid ${tokens.borderColor}`,
        background: 'transparent',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 4px',
          background: 'transparent',
          textAlign: 'left',
          color: tokens.textPrimary,
          fontSize: '13px',
          fontWeight: 500,
        }}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={open ? 'Collapse' : 'Expand'}
          style={{
            width: '16px',
            height: '16px',
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform 0.15s ease',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        >
          <ChevronDown size={13} color={tokens.textMuted} />
        </button>
        <div
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggle();
            }
          }}
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {title}
        </div>
        {badge}
      </div>
      {open && (
        <div style={{ padding: '10px 4px 14px 28px', background: 'transparent' }}>
          {children}
        </div>
      )}
    </div>
  );
}
