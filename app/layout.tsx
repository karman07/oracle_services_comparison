import type { Metadata } from 'next';
import { DM_Sans, DM_Mono } from 'next/font/google';
import { ThemeProvider } from '@/src/context/ThemeContext';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Intellinum Comparison',
  description: 'Intellinum API Comparison — Oracle Fusion SCM 25C vs 26B',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body style={{ margin: 0, padding: 0 }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
