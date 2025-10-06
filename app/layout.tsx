import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Restaurant Analytics Dashboard',
  description: 'Real-time restaurant competitive intelligence and analytics platform',
  keywords: 'restaurant, analytics, scraping, competitive intelligence, reviews, menu analysis',
  authors: [{ name: 'Restaurant Analytics Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div id="root">
          {children}
        </div>
        {/* Portal for modals */}
        <div id="modal-root" />
      </body>
    </html>
  );
}