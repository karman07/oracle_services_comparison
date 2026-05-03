'use client';

import { useState } from 'react';
import { Download, FileJson, FileText, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { DiffResult } from '../types/diff.types';
import { exportAsJson, exportAsPdf } from '../services/reportGenerator';

interface ExportPanelProps { result: DiffResult }

export function ExportPanel({ result }: ExportPanelProps) {
  const { tokens } = useTheme();
  const [done, setDone] = useState<'json' | 'pdf' | null>(null);
  const [exporting, setExporting] = useState<'json' | 'pdf' | null>(null);

  async function handleExport(format: 'json' | 'pdf') {
    setExporting(format);
    setDone(null);
    try {
      if (format === 'json') exportAsJson(result);
      else exportAsPdf(result);
      setDone(format);
      setTimeout(() => setDone(null), 3000);
    } finally {
      setExporting(null);
    }
  }

  const { summary } = result;
  const totalChanges = summary.pathsAdded + summary.pathsRemoved + summary.pathsModified + summary.schemasAdded + summary.schemasRemoved + summary.schemasModified + summary.tagsAdded + summary.tagsRemoved;

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: tokens.textPrimary, margin: '0 0 6px' }}>Export Report</h2>
        <p style={{ color: tokens.textMuted, fontSize: '14px', margin: 0 }}>
          Download the complete diff for Oracle SCM 25C → 26B ({totalChanges.toLocaleString()} total changes).
        </p>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '32px',
          padding: '18px 20px',
          background: tokens.bgCard,
          border: `1px solid ${tokens.borderColor}`,
          borderRadius: tokens.radiusLg,
          boxShadow: tokens.shadowSm,
        }}
      >
        {[
          { label: 'Paths added',     value: summary.pathsAdded,      color: tokens.colorAdded },
          { label: 'Paths removed',   value: summary.pathsRemoved,    color: tokens.colorRemoved },
          { label: 'Paths modified',  value: summary.pathsModified,   color: tokens.colorModified },
          { label: 'Schema changes',  value: summary.schemasAdded + summary.schemasRemoved + summary.schemasModified, color: tokens.accentBlue },
          { label: 'Tag changes',     value: summary.tagsAdded + summary.tagsRemoved, color: '#6C63FF' },
        ].map((stat) => (
          <div key={stat.label} style={{ flex: '1 1 110px', textAlign: 'center' }}>
            <div style={{ fontSize: '26px', fontWeight: 800, color: stat.color, fontFamily: 'var(--font-dm-mono), monospace', lineHeight: 1 }}>
              {stat.value.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: tokens.textMuted, marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Download cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '440px' }}>
        {([
          { format: 'json' as const, label: 'Download JSON', sub: 'Full diff data, machine-readable • includes all path/schema/tag diffs', Icon: FileJson,  iconBg: tokens.colorAddedBg,          iconColor: tokens.colorAdded    },
          { format: 'pdf'  as const, label: 'Download PDF',  sub: 'Formatted report with tables • landscape A4, ready to share',           Icon: FileText, iconBg: tokens.accentBlueFaint, iconColor: tokens.accentBlue    },
        ]).map((opt) => {
          const isLoading = exporting === opt.format;
          const isDone    = done === opt.format;
          const Icon = opt.Icon;

          return (
            <button
              key={opt.format}
              onClick={() => handleExport(opt.format)}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px 18px',
                borderRadius: tokens.radiusLg,
                border: isDone ? `1px solid ${tokens.colorAddedBorder}` : `1px solid ${tokens.borderColor}`,
                background: isDone ? tokens.colorAddedBg : tokens.bgCard,
                color: tokens.textPrimary,
                cursor: isLoading ? 'wait' : 'pointer',
                textAlign: 'left',
                boxShadow: tokens.shadowMd,
                opacity: isLoading ? 0.7 : 1,
                transition: 'border-color 0.2s, background 0.2s, box-shadow 0.15s',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: tokens.radiusMd,
                  background: isDone ? tokens.colorAddedBg : opt.iconBg,
                  border: `1px solid ${isDone ? tokens.colorAddedBorder : tokens.borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                {isDone
                  ? <CheckCircle size={20} color={tokens.colorAdded} />
                  : <Icon size={20} color={isLoading ? tokens.textMuted : opt.iconColor} />
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: isDone ? tokens.colorAdded : tokens.textPrimary }}>
                  {isLoading ? 'Generating…' : isDone ? 'Downloaded!' : opt.label}
                </div>
                <div style={{ fontSize: '12px', color: tokens.textMuted, marginTop: '2px', lineHeight: 1.4 }}>{opt.sub}</div>
              </div>
              {!isLoading && !isDone && <Download size={16} color={tokens.textMuted} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
