'use client';

import { useTheme } from '../context/ThemeContext';
import { GitCompare } from 'lucide-react';

export function LoadingScreen() {
  const { tokens } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: tokens.bgPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px',
      }}
    >
      {/* Animated logo */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: tokens.radiusXl,
            background: `linear-gradient(135deg, ${tokens.accentBlue}, #6C63FF)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 32px ${tokens.accentBlue}50`,
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        >
          <GitCompare size={32} color="#fff" />
        </div>
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center', maxWidth: '340px' }}>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: tokens.textPrimary,
            margin: '0 0 8px',
          }}
        >
          Analysing Oracle SCM APIs
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: tokens.textMuted,
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Comparing 5,448 paths and 20,000+ schemas
          <br />
          across release 25C and 26B. This may take a moment.
        </p>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '260px',
          height: '4px',
          background: tokens.borderColor,
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${tokens.accentBlue}, #6C63FF)`,
            borderRadius: '2px',
            animation: 'loading-bar 2.4s ease-in-out infinite',
          }}
        />
      </div>

      {/* Skeleton cards */}
      <div
        style={{
          display: 'flex',
          gap: '14px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '580px',
        }}
      >
        {[140, 120, 150, 130].map((w, i) => (
          <div
            key={i}
            style={{
              width: `${w}px`,
              height: '80px',
              borderRadius: tokens.radiusLg,
              background: tokens.bgCard,
              border: `1px solid ${tokens.borderColor}`,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, transparent 0%, ${tokens.borderColor} 50%, transparent 100%)`,
                animation: `shimmer ${1.4 + i * 0.15}s linear infinite`,
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 8px 32px ${tokens.accentBlue}50; transform: scale(1); }
          50%       { box-shadow: 0 8px 48px ${tokens.accentBlue}80; transform: scale(1.04); }
        }
        @keyframes loading-bar {
          0%   { width: 0%;    margin-left: 0; }
          50%  { width: 70%;   margin-left: 30%; }
          100% { width: 0%;    margin-left: 100%; }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
