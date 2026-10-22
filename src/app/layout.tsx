import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import VisitTracker from '@/components/layout/VisitTracker';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DakDin - Help Center Management Software',
  description: 'Complete healthcare management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {/* Site-wide page-view counter (fire-and-forget, admin Security tab). */}
        <VisitTracker />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
