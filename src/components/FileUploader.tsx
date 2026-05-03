'use client';

import { useCallback, useState } from 'react';
import {
  Upload,
  FileJson,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getFileStats } from '../utils/openApiParser';
import type { UploadedFiles, OpenApiSpec } from '../types/diff.types';

interface FileSlotProps {
  slot: '25c' | '26b';
  label: string;
  file: File | null;
  spec: OpenApiSpec | null;
  error: string | null;
  onLoad: (slot: '25c' | '26b', file: File) => void;
}

function FileSlot({ slot, label, file, spec, error, onLoad }: FileSlotProps) {
  const { tokens } = useTheme();
  const [dragging, setDragging] = useState(false);
  const inputId = `file-input-${slot}`;

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onLoad(slot, dropped);
    },
    [slot, onLoad],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = e.target.files?.[0];
      if (picked) onLoad(slot, picked);
    },
    [slot, onLoad],
  );

  const stats = spec ? getFileStats(spec) : null;

  const borderColor = dragging
    ? tokens.accentBlue
    : error
      ? tokens.colorRemoved
      : spec
        ? tokens.colorAdded
        : tokens.borderColorStrong;

  return (
    <div style={{ flex: 1, minWidth: '260px' }}>
      <label
        htmlFor={inputId}
        style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: 600,
          fontSize: '14px',
          color: tokens.textPrimary,
          cursor: 'pointer',
        }}
      >
        {label}
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: tokens.radiusLg,
          background: dragging ? `${tokens.accentBlue}0D` : tokens.bgCard,
          padding: '28px 20px',
          textAlign: 'center',
          transition: 'border-color 0.2s, background 0.2s',
          minHeight: '160px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <input
          id={inputId}
          type="file"
          accept=".json,application/json"
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        {!file && (
          <>
            <Upload size={28} color={tokens.textMuted} />
            <p style={{ color: tokens.textMuted, fontSize: '14px', margin: 0 }}>
              Drag & drop or{' '}
              <label
                htmlFor={inputId}
                style={{
                  color: tokens.accentBlue,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                browse
              </label>
            </p>
            <p style={{ color: tokens.textMuted, fontSize: '12px', margin: 0 }}>
              OpenAPI 3.x JSON only
            </p>
          </>
        )}

        {file && error && (
          <>
            <AlertCircle size={28} color={tokens.colorRemoved} />
            <p
              style={{
                color: tokens.colorRemoved,
                fontSize: '13px',
                fontWeight: 600,
                margin: 0,
              }}
            >
              {file.name}
            </p>
            <p
              style={{
                color: tokens.colorRemoved,
                fontSize: '12px',
                margin: 0,
                maxWidth: '260px',
              }}
            >
              {error}
            </p>
            <label
              htmlFor={inputId}
              style={{
                color: tokens.accentBlue,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Choose a different file
            </label>
          </>
        )}

        {file && spec && stats && (
          <>
            <CheckCircle size={28} color={tokens.colorAdded} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileJson size={16} color={tokens.textMuted} />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: tokens.textPrimary,
                }}
              >
                {file.name}
              </span>
            </div>
            <p
              style={{
                color: tokens.textMuted,
                fontSize: '12px',
                margin: 0,
              }}
            >
              {stats.title} · v{stats.version}
            </p>
            <div
              style={{
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginTop: '4px',
              }}
            >
              {(
                [
                  { label: 'Paths', value: stats.pathCount },
                  { label: 'Schemas', value: stats.schemaCount },
                  { label: 'Tags', value: stats.tagCount },
                ] as const
              ).map((stat) => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: tokens.accentBlue,
                      fontFamily: 'var(--font-dm-mono), monospace',
                    }}
                  >
                    {stat.value.toLocaleString()}
                  </div>
                  <div
                    style={{ fontSize: '11px', color: tokens.textMuted }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            <label
              htmlFor={inputId}
              style={{
                color: tokens.textMuted,
                fontSize: '11px',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              Replace file
            </label>
          </>
        )}
      </div>
    </div>
  );
}

interface FileUploaderProps {
  files: UploadedFiles;
  loading: boolean;
  onLoad: (slot: '25c' | '26b', file: File) => void;
}

export function FileUploader({ files, loading, onLoad }: FileUploaderProps) {
  const { tokens } = useTheme();

  return (
    <div>
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: tokens.textPrimary,
          marginTop: 0,
          marginBottom: '24px',
        }}
      >
        Upload OpenAPI Files
      </h2>

      {loading && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            background: `${tokens.accentBlue}18`,
            border: `1px solid ${tokens.accentBlue}40`,
            borderRadius: tokens.radiusMd,
            color: tokens.accentBlue,
            fontSize: '14px',
          }}
        >
          Parsing file…
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <FileSlot
          slot="25c"
          label="25C — Baseline"
          file={files.file25c}
          spec={files.spec25c}
          error={files.error25c}
          onLoad={onLoad}
        />
        <FileSlot
          slot="26b"
          label="26B — Target"
          file={files.file26b}
          spec={files.spec26b}
          error={files.error26b}
          onLoad={onLoad}
        />
      </div>

      {files.spec25c && files.spec26b && (
        <div
          style={{
            marginTop: '20px',
            padding: '12px 16px',
            background: tokens.colorAddedBg,
            border: `1px solid ${tokens.colorAdded}40`,
            borderRadius: tokens.radiusMd,
            color: tokens.colorAdded,
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Both files loaded — navigate to Summary to see the diff.
        </div>
      )}
    </div>
  );
}
