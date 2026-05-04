'use client';

import { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Sidebar, type SectionId } from './Sidebar';
import { TopNav } from './TopNav';
import { DiffSummary } from '../DiffSummary';
import { ApiDiffList } from '../ApiDiffList';
import { SchemaDiffViewer } from '../SchemaDiffViewer';
import { ExportPanel } from '../ExportPanel';
import { LoadingScreen } from '../LoadingScreen';
import { useComparison } from '../../hooks/useComparison';
import { useTheme } from '../../context/ThemeContext';

export function AppShell() {
  const { tokens } = useTheme();
  const [activeSection, setActiveSection] = useState<SectionId>('all');
  const { loading, diffResult, error } = useComparison();

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: tokens.bgPrimary,
          color: tokens.textPrimary,
        }}
      >
        <TopNav />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: tokens.colorRemovedBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={24} color={tokens.colorRemoved} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: '18px', margin: '0 0 6px', color: tokens.textPrimary }}>
              Failed to load diff
            </p>
            <p style={{ color: tokens.textMuted, fontSize: '14px', margin: 0, maxWidth: '400px' }}>
              {error}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              background: tokens.accentBlue,
              color: tokens.accentBlueText,
              border: 'none',
              borderRadius: tokens.radiusMd,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: tokens.bgPrimary,
        color: tokens.textPrimary,
        overflow: 'hidden',
      }}
    >
      <TopNav />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          active={activeSection}
          onNavigate={setActiveSection}
          diffResult={diffResult}
        />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px 36px',
          }}
        >
          {activeSection === 'summary'  && diffResult && <DiffSummary result={diffResult} />}
          {activeSection === 'all'      && diffResult && <ApiDiffList diffs={diffResult.pathDiffs} filterType="all"      title="All Changed APIs" />}
          {activeSection === 'added'    && diffResult && <ApiDiffList diffs={diffResult.pathDiffs} filterType="added"    title="Added APIs"    />}
          {activeSection === 'removed'  && diffResult && <ApiDiffList diffs={diffResult.pathDiffs} filterType="removed"  title="Removed APIs"  />}
          {activeSection === 'modified' && diffResult && <ApiDiffList diffs={diffResult.pathDiffs} filterType="modified" title="Modified APIs" />}
          {activeSection === 'schemas'  && diffResult && <SchemaDiffViewer schemaDiffs={diffResult.schemaDiffs} />}
          {activeSection === 'export'   && diffResult && <ExportPanel result={diffResult} />}
        </main>
      </div>
    </div>
  );
}
