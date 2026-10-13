import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SmoothScroll } from '@/components/motion/SmoothScroll';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const geist = Geist({
  subsets: ['latin'],
  variable: '--app-font-sans',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--app-font-display',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--app-font-mono',
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

export const viewport: Viewport = {
  themeColor: '#0b0b0e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${instrumentSerif.variable} ${geistMono.variable}`}
    >
      <body>
        <Providers>
          <SmoothScroll />
          <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </div>
        </Providers>
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
