import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { CityLandmark } from "@/components/city/CityLandmark";
import { CityListings } from "@/components/city/CityListings";
import { JsonLd } from "@/components/seo/JsonLd";
import { CITY_PAGES, getCityPage } from "@/lib/cities";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Fully static: one page per configured city, built at deploy time. Any
// other top-level path 404s here rather than matching this segment.
// Listings are fetched client-side by <CityListings>, so they stay live.
export const dynamicParams = false;

export function generateStaticParams() {
  return CITY_PAGES.map((city) => ({ citySlug: city.slug }));
}

type Props = { params: Promise<{ citySlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityPage((await params).citySlug);
  if (!city) return {};

  const title = `Buy Used GPUs in ${city.name}`;
  return {
    title,
    description: city.intro,
    alternates: { canonical: `/${city.slug}` },
    openGraph: { title: `${title} | ${SITE_NAME}`, description: city.intro, url: `/${city.slug}` },
  };
}

export default async function CityPage({ params }: Props) {
  const city = getCityPage((await params).citySlug);
  if (!city) notFound();

  const url = `${SITE_URL}/${city.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
          { "@type": "ListItem", position: 2, name: `GPUs in ${city.name}`, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: city.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };

  const otherCities = CITY_PAGES.filter((c) => c.slug !== city.slug);

  return (
    <>
      <JsonLd data={structuredData} />
      <PageHeader
        eyebrow={`Used GPUs · ${city.regionLabel}`}
        title={<>Buy GPUs in <em>{city.name}.</em></>}
        description={city.intro}
        aside={
          <CityLandmark
            landmark={city.landmark}
            label={`Line illustration of the ${city.landmarkName}, ${city.name}`}
            className="mx-auto h-56 w-56 text-foreground/80 sm:h-64 sm:w-64 lg:h-80 lg:w-80"
          />
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="accent">
            <a href="#city-listings">See {city.name} listings</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sell">Sell a GPU in {city.name}</Link>
          </Button>
        </div>
      </PageHeader>

      <div className="container mx-auto px-4 py-14 sm:px-6 lg:px-8">
        <CityListings cityName={city.name} apiCity={city.apiCity} country={city.country} />
      </div>

      <section className="border-t border-border bg-secondary/40 py-16 md:py-20">
        <div className="container mx-auto grid gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="space-y-10 lg:col-span-7">
            {city.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="font-display text-3xl leading-tight md:text-4xl">{section.heading}</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Buying a GPU in {city.name}: FAQ
            </h2>
            <dl className="mt-4 divide-y divide-border border-y border-border">
              {city.faqs.map((faq) => (
                <div key={faq.q} className="py-5">
                  <dt className="font-semibold">{faq.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section data-nav="dark" className="dark bg-background py-16 text-foreground md:py-20">
        <div className="container mx-auto grid gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="font-display text-4xl leading-tight md:text-5xl">
              Need GPUs in {city.name} we don&apos;t have?
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Tell us the model, quantity, budget and timeline. We&apos;ll search our supply network and come back to you.
            </p>
            <Button asChild size="lg" variant="accent" className="mt-8">
              <Link href="/request">
                Request hardware
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <nav aria-label="GPUs in other cities">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Other cities</h2>
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {otherCities.map((other) => (
                <li key={other.slug}>
                  <Link href={`/${other.slug}`} className="group flex items-center justify-between py-4">
                    <span className="font-display text-2xl">Buy GPUs in {other.name}</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/gpus-by-city" className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              See all cities <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </section>
    </>
  );
}
