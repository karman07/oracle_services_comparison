'use client';

import { Plus, Minus, RefreshCw, Tag, Layers, ArrowRight } from 'lucide-react';
import type { ComponentType } from 'react';
import { useTheme } from '../context/ThemeContext';
import type { DiffResult } from '../types/diff.types';

interface DiffSummaryProps { result: DiffResult }

interface CardDef {
  label: string;
  value: number;
  icon: ComponentType<{ size?: number; color?: string }>;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  sub?: string;
}

export function DiffSummary({ result }: DiffSummaryProps) {
  const { tokens } = useTheme();
  const { summary, pathDiffs, schemaDiffs, tagDiffs } = result;

  const totalPathChanges = summary.pathsAdded + summary.pathsRemoved + summary.pathsModified;
  const totalSchemaChanges = summary.schemasAdded + summary.schemasRemoved + summary.schemasModified;

  const cards: CardDef[] = [
    { label: 'Paths Added',     value: summary.pathsAdded,      icon: Plus,      accentColor: tokens.colorAdded,    accentBg: tokens.colorAddedBg,    accentBorder: tokens.colorAddedBorder,    sub: 'New in 26B' },
    { label: 'Paths Removed',   value: summary.pathsRemoved,    icon: Minus,     accentColor: tokens.colorRemoved,  accentBg: tokens.colorRemovedBg,  accentBorder: tokens.colorRemovedBorder,  sub: 'Gone from 25C' },
    { label: 'Paths Modified',  value: summary.pathsModified,   icon: RefreshCw, accentColor: tokens.colorModified, accentBg: tokens.colorModifiedBg, accentBorder: tokens.colorModifiedBorder, sub: 'Changed operations' },
    { label: 'Schemas Added',   value: summary.schemasAdded,    icon: Layers,    accentColor: tokens.colorAdded,    accentBg: tokens.colorAddedBg,    accentBorder: tokens.colorAddedBorder,    sub: 'New component schemas' },
    { label: 'Schemas Removed', value: summary.schemasRemoved,  icon: Layers,    accentColor: tokens.colorRemoved,  accentBg: tokens.colorRemovedBg,  accentBorder: tokens.colorRemovedBorder,  sub: 'Dropped schemas' },
    { label: 'Schemas Modified',value: summary.schemasModified, icon: Layers,    accentColor: tokens.colorModified, accentBg: tokens.colorModifiedBg, accentBorder: tokens.colorModifiedBorder, sub: 'Field-level changes' },
    { label: 'Tags Added',      value: summary.tagsAdded,       icon: Tag,       accentColor: tokens.colorAdded,    accentBg: tokens.colorAddedBg,    accentBorder: tokens.colorAddedBorder,    sub: 'New API groups' },
    { label: 'Tags Removed',    value: summary.tagsRemoved,     icon: Tag,       accentColor: tokens.colorRemoved,  accentBg: tokens.colorRemovedBg,  accentBorder: tokens.colorRemovedBorder,  sub: 'Removed groups' },
  ];

  return (
    <div>
      {/* Hero banner */}
      <div
        style={{
          background: tokens.bgCard,
          border: `1px solid ${tokens.borderColor}`,
          borderLeft: `4px solid ${tokens.accentBlue}`,
          borderRadius: tokens.radiusLg,
          padding: '24px 28px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: tokens.shadowSm,
        }}
      >
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: tokens.textPrimary, margin: '0 0 4px' }}>
            Diff Summary
          </h2>
          <p style={{ color: tokens.textMuted, fontSize: '14px', margin: 0 }}>
            Oracle Fusion SCM · Release 25C compared to 26B
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Path changes',   value: totalPathChanges,   color: tokens.accentBlue },
            { label: 'Schema changes', value: totalSchemaChanges, color: tokens.colorModified },
            { label: 'Tag changes',    value: tagDiffs.length,    color: tokens.colorAdded },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                textAlign: 'center',
                padding: '10px 20px',
                background: tokens.bgCard,
                borderRadius: tokens.radiusLg,
                border: `1px solid ${tokens.borderColor}`,
                boxShadow: tokens.shadowSm,
              }}
            >
              <div style={{ fontSize: '26px', fontWeight: 800, color: stat.color, fontFamily: 'var(--font-dm-mono), monospace', lineHeight: 1 }}>
                {stat.value.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: tokens.textMuted, marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))',
          gap: '14px',
          marginBottom: '32px',
        }}
      >
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              style={{
                background: tokens.bgCard,
                border: `1px solid ${tokens.borderColor}`,
                borderLeft: `3px solid ${card.accentColor}`,
                borderRadius: tokens.radiusLg,
                padding: '18px 18px 16px',
                boxShadow: tokens.shadowSm,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: tokens.textMuted, fontWeight: 500 }}>{card.label}</span>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: tokens.radiusSm,
                    background: card.accentBg,
                    border: `1px solid ${card.accentBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} color={card.accentColor} />
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: card.accentColor, fontFamily: 'var(--font-dm-mono), monospace', lineHeight: 1, marginBottom: '6px' }}>
                {card.value.toLocaleString()}
              </div>
              {card.sub && (
                <div style={{ fontSize: '11px', color: tokens.textMuted }}>{card.sub}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick breakdown bar */}
      <div
        style={{
          background: tokens.bgCard,
          border: `1px solid ${tokens.borderColor}`,
          borderRadius: tokens.radiusLg,
          padding: '20px 24px',
          boxShadow: tokens.shadowSm,
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 600, color: tokens.textSecondary, marginBottom: '14px' }}>
          Path change breakdown
        </div>
        <div style={{ display: 'flex', gap: '0', borderRadius: tokens.radiusSm, overflow: 'hidden', height: '10px', marginBottom: '14px' }}>
          {[
            { value: summary.pathsAdded,    color: tokens.colorAdded },
            { value: summary.pathsModified, color: tokens.colorModified },
            { value: summary.pathsRemoved,  color: tokens.colorRemoved },
          ].map((seg, i) => {
            const pct = totalPathChanges > 0 ? (seg.value / totalPathChanges) * 100 : 0;
            return pct > 0 ? (
              <div key={i} style={{ width: `${pct}%`, background: seg.color, transition: 'width 0.6s ease' }} />
            ) : null;
          })}
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'Added',    value: summary.pathsAdded,    color: tokens.colorAdded },
            { label: 'Modified', value: summary.pathsModified, color: tokens.colorModified },
            { label: 'Removed',  value: summary.pathsRemoved,  color: tokens.colorRemoved },
          ].map((leg) => (
            <div key={leg.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: leg.color, flexShrink: 0 }} />
              <span style={{ color: tokens.textMuted }}>{leg.label}</span>
              <span style={{ fontWeight: 700, color: leg.color, fontFamily: 'var(--font-dm-mono), monospace' }}>
                {leg.value.toLocaleString()}
              </span>
              <ArrowRight size={10} color={tokens.textMuted} />
              <span style={{ color: tokens.textMuted, fontSize: '11px' }}>
                {totalPathChanges > 0 ? ((leg.value / totalPathChanges) * 100).toFixed(1) : '0'}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
