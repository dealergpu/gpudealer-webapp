import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import Script from 'next/script';
import '../globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { HTML_LANG, LOCALES, isLocale } from '@/i18n/config';
import { getI18n, openGraphLocale } from '@/i18n/server';
import { I18nProvider } from '@/i18n/client';
import { getCnyRates } from '@/lib/cny-rates';

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

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  const description = t.meta.description;
  const ogLocale = await openGraphLocale();
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    title: {
      default: t.meta.defaultTitle,
      template: t.meta.titleTemplate,
    },
    description,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    icons: { icon: '/favicon.svg' },
    openGraph: {
      title: 'GPUDealer',
      description,
      type: 'website',
      siteName: SITE_NAME,
      url: SITE_URL,
      ...ogLocale,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'GPUDealer',
      description,
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#0b0b0e',
};

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { t } = await getI18n();
  // Only the Chinese site shows CNY approximations, so only it pays for the rates.
  const cnyRates = lang === 'zh' ? await getCnyRates() : null;

  return (
    <html
      lang={HTML_LANG[lang]}
      className={`${geist.variable} ${instrumentSerif.variable} ${geistMono.variable}`}
    >
      <body>
        <I18nProvider locale={lang} t={t} cnyRates={cnyRates}>
          <Providers>
            <SmoothScroll />
            <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
              <Navbar />
              <main className="flex-1 flex flex-col">{children}</main>
              <Footer />
            </div>
          </Providers>
        </I18nProvider>
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
