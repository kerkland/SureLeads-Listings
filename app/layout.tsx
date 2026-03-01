import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SureLeads Listings — Property infrastructure for Nigeria',
    template: '%s · SureLeads Listings',
  },
  description:
    'Find verified rental properties across Nigeria. Weekly-reconfirmed listings, agent credibility scores, and data-driven area price insights.',
  keywords: [
    'Nigerian real estate',
    'property listings Nigeria',
    'Lagos rentals',
    'Abuja apartments',
    'verified agent',
    'SureLeads',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    siteName: 'SureLeads Listings',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
