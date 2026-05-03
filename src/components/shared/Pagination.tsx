'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

interface PaginationProps {
  /** 0-indexed current page */
  page: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions?: readonly number[];
  totalItems: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
}

/** Returns 0-indexed page numbers or '...' sentinel for ellipsis. */
function pageWindow(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);

  const pages: (number | '...')[] = [];

  if (current <= 3) {
    for (let i = 0; i < Math.min(5, total); i++) pages.push(i);
    if (total > 6) pages.push('...');
    pages.push(total - 1);
  } else if (current >= total - 4) {
    pages.push(0);
    if (total > 6) pages.push('...');
    for (let i = Math.max(0, total - 5); i < total; i++) pages.push(i);
  } else {
    pages.push(0);
    pages.push('...');
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push('...');
    pages.push(total - 1);
  }

  return pages;
}

export function Pagination({
  page,
  totalPages,
  pageSize,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const { tokens } = useTheme();

  if (totalPages <= 1 && pageSizeOptions.length <= 1) return null;

  const window = pageWindow(page, totalPages);

  const btnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '34px',
    height: '34px',
    padding: '0 8px',
    borderRadius: tokens.radiusMd,
    border: `1px solid ${tokens.borderColor}`,
    background: tokens.bgCard,
    color: tokens.textSecondary,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'background 0.12s, border-color 0.12s, color 0.12s',
  };

  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: tokens.accentBlue,
    border: `1px solid ${tokens.accentBlue}`,
    color: tokens.accentBlueText,
    fontWeight: 700,
  };

  const btnDisabled: React.CSSProperties = {
    ...btnBase,
    opacity: 0.35,
    cursor: 'not-allowed',
  };

  const startItem = totalPages === 0 ? 0 : page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '24px',
        padding: '12px 16px',
        background: tokens.bgCard,
        border: `1px solid ${tokens.borderColor}`,
        borderRadius: tokens.radiusLg,
        boxShadow: tokens.shadowSm,
      }}
    >
      {/* Left: item count */}
      <span
        style={{
          fontSize: '12px',
          color: tokens.textMuted,
          fontFamily: 'var(--font-dm-mono), monospace',
          whiteSpace: 'nowrap',
        }}
      >
        {startItem}–{endItem} of {totalItems.toLocaleString()}
      </span>

      {/* Centre: prev · page buttons · next */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            style={page === 0 ? btnDisabled : btnBase}
          >
            <ChevronLeft size={14} />
          </button>

          {window.map((w, i) =>
            w === '...' ? (
              <span
                key={`ellipsis-${i}`}
                style={{ padding: '0 4px', fontSize: '13px', color: tokens.textMuted, userSelect: 'none' }}
              >
                …
              </span>
            ) : (
              <button
                key={w}
                onClick={() => onPageChange(w as number)}
                style={w === page ? btnActive : btnBase}
              >
                {(w as number) + 1}
              </button>
            ),
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages - 1}
            style={page === totalPages - 1 ? btnDisabled : btnBase}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Right: rows per page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: tokens.textMuted, whiteSpace: 'nowrap' }}>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: tokens.textPrimary,
            background: tokens.bgTertiary,
            border: `1px solid ${tokens.borderColorStrong}`,
            borderRadius: tokens.radiusSm,
            padding: '5px 8px',
            cursor: 'pointer',
            outline: 'none',
            fontFamily: 'var(--font-dm-mono), monospace',
          }}
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
