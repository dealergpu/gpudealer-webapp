import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--app-font-sans',
});

const description =
  'GPUDealer — used GPUs, AI servers, memory and compute hardware. Find. Sell. Request.';

export const metadata: Metadata = {
  title: {
    default: 'GPUDealer — Find. Sell. Request.',
    template: '%s | GPUDealer',
  },
  description,
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'GPUDealer',
    description,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GPUDealer',
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
