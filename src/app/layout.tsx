import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Serif } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// ─── Fonts ────────────────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Noto Serif for Urdu text (Nastaliq script)
// Note: Using latin + arabic subsets for Urdu compatibility
const notoSerif = Noto_Serif({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-serif',
  display: 'swap',
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: 'FasalGuard — AI Crop Disease Detection',
    template: '%s | FasalGuard',
  },
  description:
    'Detect crop diseases instantly with AI. Get bilingual (Urdu/English) treatment recommendations for Pakistani farmers. فصل گارڈ — اے آئی سے فصل کی بیماری کی شناخت۔',
  manifest: '/manifest.json',
  keywords: [
    'crop disease detection',
    'Pakistan farming',
    'فصل بیماری',
    'زرعی ایپ',
    'AI agriculture',
    'plant disease',
  ],
  authors: [{ name: 'FasalGuard' }],
  other: {
    google: 'notranslate',
  },
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    title: 'FasalGuard — AI Crop Disease Detection',
    description:
      'Instantly detect crop diseases and get bilingual treatment recommendations.',
    siteName: 'FasalGuard',
  },
  icons: {
    icon: [
      { url: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#012d1d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // NOTE: lang and dir are set dynamically in the client LanguageProvider
    // The server default is 'ur' and 'rtl' matching the default language
    <html
      lang="ur"
      dir="rtl"
      translate="no"
      className={`${inter.variable} ${notoSerif.variable} notranslate`}
      suppressHydrationWarning // Needed for dynamic lang/dir
    >
      <body className="bg-bg-primary font-sans antialiased select-none touch-callout-none">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
