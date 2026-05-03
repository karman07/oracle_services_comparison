'use client';

import { useState, useMemo, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { PathDiff, ChangeType } from '../types/diff.types';
import { Badge } from './shared/Badge';
import { MethodBadge } from './shared/MethodBadge';
import { SearchFilterBar } from './SearchFilterBar';
import { Accordion } from './shared/Accordion';
import { Pagination, PAGE_SIZE_OPTIONS } from './shared/Pagination';

const DEFAULT_PAGE_SIZE = 25;

interface ApiDiffListProps {
  diffs: PathDiff[];
  filterType: ChangeType | 'all';
  title: string;
}

const ROUTE_SORT_PRIORITY: Record<ChangeType, number> = {
  modified: 0,
  added: 1,
  removed: 2,
};

function deriveMethodSnapshot(diff: PathDiff): { oldMethods: string[]; newMethods: string[] } {
  if (diff.oldMethods && diff.newMethods) {
    return {
      oldMethods: [...diff.oldMethods].sort(),
      newMethods: [...diff.newMethods].sort(),
    };
  }

  const added = diff.methods?.added ?? [];
  const removed = diff.methods?.removed ?? [];
  const modified = diff.methods?.modified ?? [];

  if (diff.changeType === 'added') {
    return { oldMethods: [], newMethods: [...added].sort() };
  }
  if (diff.changeType === 'removed') {
    return { oldMethods: [...removed].sort(), newMethods: [] };
  }

  return {
    oldMethods: [...new Set([...removed, ...modified])].sort(),
    newMethods: [...new Set([...added, ...modified])].sort(),
  };
}

export function ApiDiffList({ diffs, filterType, title }: ApiDiffListProps) {
  const { tokens } = useTheme();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const base = useMemo(() => {
    const byFilter = filterType === 'all' ? [...diffs] : diffs.filter((d) => d.changeType === filterType);
    if (filterType !== 'all') return byFilter;

    return byFilter.sort(
      (a, b) => ROUTE_SORT_PRIORITY[a.changeType] - ROUTE_SORT_PRIORITY[b.changeType] || a.path.localeCompare(b.path),
    );
  }, [diffs, filterType]);

  const filtered = useMemo(() => {
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((d) => d.path.toLowerCase().includes(q));
  }, [base, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(
    () => filtered.slice(page * pageSize, (page + 1) * pageSize),
    [filtered, page, pageSize],
  );

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(0); }, []);
  const handlePageSize = useCallback((size: number) => { setPageSize(size); setPage(0); }, []);
  const handleCopyPath = useCallback(async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath((p) => (p === path ? null : p)), 1200);
    } catch {
      // no-op: clipboard may be blocked by browser policy
    }
  }, []);

  const colorMap: Record<ChangeType | 'all', string> = {
    added:    tokens.colorAdded,
    removed:  tokens.colorRemoved,
    modified: tokens.colorModified,
    all: tokens.accentBlue,
  };
  const accentColor = colorMap[filterType];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: tokens.textPrimary, margin: 0 }}>{title}</h2>
          <span
            style={{
              fontFamily: 'var(--font-dm-mono), monospace',
              fontSize: '13px',
              fontWeight: 700,
              color: accentColor,
              background: `${accentColor}14`,
              border: `1px solid ${accentColor}30`,
              padding: '3px 10px',
              borderRadius: '99px',
            }}
          >
            {base.length.toLocaleString()}
          </span>
        </div>
        <p style={{ color: tokens.textMuted, fontSize: '13px', margin: 0 }}>
          {filterType === 'all' && 'All changed endpoints, with updated routes listed first.'}
          {filterType === 'added' && 'Endpoints present in 26B that did not exist in 25C.'}
          {filterType === 'removed' && 'Endpoints that were available in 25C but have been removed in 26B.'}
          {filterType === 'modified' && 'Endpoints present in both releases but with operation or parameter changes.'}
        </p>
      </div>

      <SearchFilterBar
        value={search}
        onChange={handleSearch}
        placeholder="Filter by path…"
        count={filtered.length}
        total={base.length}
      />

      {paginated.length === 0 && (
        <div style={{ padding: '64px', textAlign: 'center', color: tokens.textMuted, fontSize: '14px' }}>
          No results match your filter.
        </div>
      )}

      <div style={{ borderTop: `1px solid ${tokens.borderColor}` }}>
        {paginated.map((diff) => {
          const { oldMethods, newMethods } = deriveMethodSnapshot(diff);

          return (
            <Accordion
              key={diff.path}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: '12px', wordBreak: 'break-all', color: tokens.textPrimary, flex: 1, minWidth: 0 }}>
                    {diff.path}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleCopyPath(diff.path);
                    }}
                    aria-label="Copy route path"
                    title="Copy route path"
                    style={{
                      border: `1px solid ${tokens.borderColor}`,
                      background: 'transparent',
                      color: copiedPath === diff.path ? tokens.colorAdded : tokens.textMuted,
                      borderRadius: tokens.radiusSm,
                      height: '22px',
                      width: '22px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {copiedPath === diff.path ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              }
              badge={<Badge type={diff.changeType} />}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    border: `1px solid ${tokens.colorRemovedBorder}`,
                    borderRadius: tokens.radiusMd,
                    padding: '9px 10px',
                    background: `${tokens.colorRemoved}08`,
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: tokens.colorRemoved, marginBottom: '8px' }}>
                    - 25C (Before)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {oldMethods.length > 0 ? oldMethods.map((m) => <MethodBadge key={`old-${m}`} method={m} />) : (
                      <span style={{ fontSize: '12px', color: tokens.textMuted, fontStyle: 'italic' }}>No route methods</span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    border: `1px solid ${tokens.colorAddedBorder}`,
                    borderRadius: tokens.radiusMd,
                    padding: '9px 10px',
                    background: `${tokens.colorAdded}08`,
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: tokens.colorAdded, marginBottom: '8px' }}>
                    + 26B (Now)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {newMethods.length > 0 ? newMethods.map((m) => <MethodBadge key={`new-${m}`} method={m} />) : (
                      <span style={{ fontSize: '12px', color: tokens.textMuted, fontStyle: 'italic' }}>No route methods</span>
                    )}
                  </div>
                </div>
              </div>

              {((diff.methods?.added.length ?? 0) > 0 || (diff.methods?.removed.length ?? 0) > 0 || (diff.methods?.modified.length ?? 0) > 0) && (
                <div style={{ borderTop: `1px solid ${tokens.borderColor}`, paddingTop: '10px' }}>
                  {(diff.methods?.added.length ?? 0) > 0 && (
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: tokens.colorAdded, fontWeight: 700 }}>+ Added in 26B</span>
                      {diff.methods!.added.map((m) => <MethodBadge key={`added-${m}`} method={m} />)}
                    </div>
                  )}
                  {(diff.methods?.removed.length ?? 0) > 0 && (
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: tokens.colorRemoved, fontWeight: 700 }}>- Removed in 26B</span>
                      {diff.methods!.removed.map((m) => <MethodBadge key={`removed-${m}`} method={m} />)}
                    </div>
                  )}
                  {(diff.methods?.modified.length ?? 0) > 0 && (
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: tokens.colorModified, fontWeight: 700 }}>~ Updated in both</span>
                      {diff.methods!.modified.map((m) => <MethodBadge key={`modified-${m}`} method={m} />)}
                    </div>
                  )}
                </div>
              )}

              {diff.details.length > 0 && (
                <div style={{ borderTop: `1px solid ${tokens.borderColor}`, paddingTop: '10px', marginTop: '4px' }}>
                  {diff.details.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: tokens.textMuted, fontSize: '12px', lineHeight: 1.2 }}>~</span>
                      <span style={{ fontSize: '12px', color: tokens.textSecondary }}>{d}</span>
                    </div>
                  ))}
                </div>
              )}
            </Accordion>
          );
        })}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        totalItems={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={handlePageSize}
      />
    </div>
  );
}
