'use client';

import { useState, useMemo, useCallback } from 'react';
import { ArrowRight, Copy, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { SchemaDiff, ChangeType, RouteSchemaChangeType } from '../types/diff.types';
import { Badge } from './shared/Badge';
import { Accordion } from './shared/Accordion';
import { SearchFilterBar } from './SearchFilterBar';
import { Pagination, PAGE_SIZE_OPTIONS } from './shared/Pagination';
import { MethodBadge } from './shared/MethodBadge';

const DEFAULT_PAGE_SIZE = 25;

interface SchemaDiffViewerProps { schemaDiffs: SchemaDiff[] }
type SchemaFilter = 'all' | 'added' | 'removed' | 'modified';

const SCHEMA_FILTER_PRIORITY: Record<ChangeType, number> = {
  modified: 0,
  added: 1,
  removed: 2,
};

const ROUTE_CHANGE_STYLE: Record<RouteSchemaChangeType, { color: string; border: string; label: string }> = {
  updated: { color: '#B45309', border: '#FCD34D', label: 'Updated Route' },
  added: { color: '#166534', border: '#86EFAC', label: 'Route Added' },
  removed: { color: '#B91C1C', border: '#FCA5A5', label: 'Route Removed' },
  unchanged: { color: '#475569', border: '#CBD5E1', label: 'Unchanged Route' },
};

export function SchemaDiffViewer({ schemaDiffs }: SchemaDiffViewerProps) {
  const { tokens } = useTheme();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedFilter, setSelectedFilter] = useState<SchemaFilter>('all');
  const [copiedSchema, setCopiedSchema] = useState<string | null>(null);

  const filteredByType = useMemo(() => {
    const byType = selectedFilter === 'all'
      ? [...schemaDiffs]
      : schemaDiffs.filter((s) => s.changeType === selectedFilter);

    if (selectedFilter !== 'all') return byType;

    return byType.sort(
      (a, b) => SCHEMA_FILTER_PRIORITY[a.changeType] - SCHEMA_FILTER_PRIORITY[b.changeType] || a.schemaName.localeCompare(b.schemaName),
    );
  }, [schemaDiffs, selectedFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return filteredByType;
    const q = search.toLowerCase();
    return filteredByType.filter((s) => {
      if (s.schemaName.toLowerCase().includes(q)) return true;
      return s.impactedRoutes.some((route) => route.path.toLowerCase().includes(q) || route.method.toLowerCase().includes(q));
    });
  }, [filteredByType, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(
    () => filtered.slice(page * pageSize, (page + 1) * pageSize),
    [filtered, page, pageSize],
  );

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(0); }, []);
  const handlePageSize = useCallback((size: number) => { setPageSize(size); setPage(0); }, []);
  const handleCopySchema = useCallback(async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      setCopiedSchema(name);
      setTimeout(() => setCopiedSchema((s) => (s === name ? null : s)), 1200);
    } catch {
      // no-op
    }
  }, []);

  const stats = useMemo(() => ({
    added:    schemaDiffs.filter(s => s.changeType === 'added').length,
    removed:  schemaDiffs.filter(s => s.changeType === 'removed').length,
    modified: schemaDiffs.filter(s => s.changeType === 'modified').length,
  }), [schemaDiffs]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: tokens.textPrimary, margin: '0 0 12px' }}>
          Schema Changes
        </h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {([
            { type: 'all' as const, label: 'All', value: schemaDiffs.length, color: tokens.accentBlue, bg: tokens.accentBlueFaint, border: `${tokens.accentBlue}40` },
            { type: 'added' as const, label: 'Added',    value: stats.added,    color: tokens.colorAdded,    bg: tokens.colorAddedBg,    border: tokens.colorAddedBorder },
            { type: 'removed' as const, label: 'Removed',  value: stats.removed,  color: tokens.colorRemoved,  bg: tokens.colorRemovedBg,  border: tokens.colorRemovedBorder },
            { type: 'modified' as const, label: 'Modified', value: stats.modified, color: tokens.colorModified, bg: tokens.colorModifiedBg, border: tokens.colorModifiedBorder },
          ] as const).map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                setSelectedFilter(s.type);
                setPage(0);
              }}
              aria-pressed={selectedFilter === s.type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                background: selectedFilter === s.type ? s.bg : 'transparent',
                border: `1px solid ${selectedFilter === s.type ? s.border : tokens.borderColor}`,
                borderRadius: '99px',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 700, color: selectedFilter === s.type ? s.color : tokens.textMuted, fontFamily: 'var(--font-dm-mono), monospace' }}>{s.value.toLocaleString()}</span>
              <span style={{ fontSize: '12px', color: selectedFilter === s.type ? s.color : tokens.textMuted }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <SearchFilterBar value={search} onChange={handleSearch} placeholder="Filter by schema name…" count={filtered.length} total={filteredByType.length} />

      {paginated.length === 0 && (
        <div style={{ padding: '64px', textAlign: 'center', color: tokens.textMuted, fontSize: '14px' }}>No schema changes match your filter.</div>
      )}

      <div style={{ borderTop: `1px solid ${tokens.borderColor}` }}>
        {paginated.map((schema) => (
          <Accordion
            key={schema.schemaName}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: '12px', color: tokens.textPrimary, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {schema.schemaName}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleCopySchema(schema.schemaName);
                  }}
                  aria-label="Copy schema name"
                  title="Copy schema name"
                  style={{
                    border: `1px solid ${tokens.borderColor}`,
                    background: 'transparent',
                    color: copiedSchema === schema.schemaName ? tokens.colorAdded : tokens.textMuted,
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
                  {copiedSchema === schema.schemaName ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            }
            badge={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {schema.changeType === 'modified' && schema.fieldDiffs.length > 0 && (
                  <span style={{ fontSize: '11px', color: tokens.textMuted, fontFamily: 'var(--font-dm-mono), monospace' }}>
                    {schema.fieldDiffs.length} fields
                  </span>
                )}
                <Badge type={schema.changeType} />
              </div>
            }
          >
            {schema.changeType !== 'modified' ? (
              <>
                <div style={{ fontSize: '13px', color: tokens.textMuted, display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                  <span style={{ fontWeight: 600 }}>25C (Earlier)</span>
                  <span>{schema.changeType === 'added' ? 'Not present' : 'Present'}</span>
                  <span style={{ fontWeight: 600 }}>26B (Now)</span>
                  <span>{schema.changeType === 'removed' ? 'Not present' : 'Present'}</span>
                </div>
                <SchemaRouteMapping routes={schema.impactedRoutes} />
              </>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', color: tokens.colorAdded, border: `1px solid ${tokens.colorAddedBorder}`, padding: '2px 8px', borderRadius: '999px' }}>
                    Added: {schema.fieldDiffs.filter((fd) => fd.changeType === 'added').length}
                  </span>
                  <span style={{ fontSize: '11px', color: tokens.colorRemoved, border: `1px solid ${tokens.colorRemovedBorder}`, padding: '2px 8px', borderRadius: '999px' }}>
                    Removed: {schema.fieldDiffs.filter((fd) => fd.changeType === 'removed').length}
                  </span>
                  <span style={{ fontSize: '11px', color: tokens.colorModified, border: `1px solid ${tokens.colorModifiedBorder}`, padding: '2px 8px', borderRadius: '999px' }}>
                    Changed Type: {schema.fieldDiffs.filter((fd) => fd.changeType === 'modified').length}
                  </span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      {['Field Path', 'Change', '25C (Earlier)', '26B (Now)'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', background: tokens.bgTertiary, color: tokens.textMuted, fontWeight: 600, fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${tokens.borderColor}`, whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schema.fieldDiffs.map((fd, i) => {
                      const rowBg = fd.changeType === 'added'
                        ? `${tokens.colorAdded}08`
                        : fd.changeType === 'removed'
                        ? `${tokens.colorRemoved}08`
                        : i % 2 === 1 ? tokens.bgTertiary : 'transparent';
                      return (
                      <tr key={fd.fieldName} style={{ background: rowBg, borderBottom: `1px solid ${tokens.borderColor}` }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-dm-mono), monospace', color: tokens.textPrimary, wordBreak: 'break-all', maxWidth: '260px' }}>
                          {fd.fieldName}
                        </td>
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          <Badge type={fd.changeType} />
                        </td>
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-dm-mono), monospace', color: fd.changeType === 'removed' ? tokens.colorRemoved : tokens.textMuted, whiteSpace: 'nowrap' }}>
                          {fd.oldType ?? '—'}
                        </td>
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-dm-mono), monospace', color: fd.changeType === 'added' ? tokens.colorAdded : tokens.textPrimary, whiteSpace: 'nowrap' }}>
                          {fd.changeType === 'modified' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <ArrowRight size={11} color={tokens.textMuted} />
                              {fd.newType ?? '—'}
                            </span>
                          )}
                          {fd.changeType !== 'modified' && (fd.newType ?? '—')}
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
                <SchemaRouteMapping routes={schema.impactedRoutes} />
              </div>
            )}
          </Accordion>
        ))}
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

function SchemaRouteMapping({ routes }: { routes: SchemaDiff['impactedRoutes'] }) {
  const { tokens } = useTheme();

  if (routes.length === 0) {
    return (
      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${tokens.borderColor}`, fontSize: '12px', color: tokens.textMuted, fontStyle: 'italic' }}>
        No routes are currently mapped to this schema.
      </div>
    );
  }

  return (
    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${tokens.borderColor}` }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: tokens.textMuted, marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Mapped Routes ({routes.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {routes.map((route) => {
          const routeStyle = ROUTE_CHANGE_STYLE[route.changeType];
          return (
            <div
              key={`${route.method}:${route.path}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: `1px solid ${tokens.borderColor}`,
                borderRadius: tokens.radiusSm,
                padding: '6px 8px',
                background: tokens.bgTertiary,
              }}
            >
              <MethodBadge method={route.method} />
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-dm-mono), monospace', color: tokens.textPrimary, flex: 1, minWidth: 0, wordBreak: 'break-all' }}>
                {route.path}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: routeStyle.color,
                  border: `1px solid ${routeStyle.border}`,
                  borderRadius: '999px',
                  padding: '2px 7px',
                  whiteSpace: 'nowrap',
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                }}
              >
                {routeStyle.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
