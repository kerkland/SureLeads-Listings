import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: 'Prop — Nigerian Real Estate Trust Platform',
  description:
    'Find verified properties and book inspections safely. Fees held in escrow until you confirm.',
  keywords: 'Nigerian real estate, property listings, Lagos, Abuja, inspection fee escrow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
