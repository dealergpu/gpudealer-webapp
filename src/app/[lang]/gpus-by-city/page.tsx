import { Link } from "@/i18n/navigation";
import { absoluteUrl, alternatesFor, getI18n, localizedHref, openGraphLocale } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { CityLandmark } from "@/components/city/CityLandmark";
import { JsonLd } from "@/components/seo/JsonLd";
import { CITY_PAGES, localizeCity } from "@/lib/cities";
import { countryName, getListingLocations, locationHref, type ListingLocation } from "@/lib/locations";
import { SITE_NAME } from "@/lib/site";

// Server-rendered per request so every city link is in the HTML for
// crawlers and counts stay current (no ISR cache on Cloudflare — see app/page.tsx).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  const c = t.citiesIndex;
  const alternates = await alternatesFor("/gpus-by-city");
  return {
    title: c.metaTitle,
    description: c.description,
    alternates,
    openGraph: { ...(await openGraphLocale()), title: `${c.metaTitle} | ${SITE_NAME}`, description: c.description, url: await localizedHref("/gpus-by-city") },
  };
}

function groupByCountry(locations: ListingLocation[]) {
  const groups = new Map<string, { country: string; total: number; cities: ListingLocation[] }>();
  for (const location of locations) {
    const group = groups.get(location.country) ?? { country: location.country, total: 0, cities: [] };
    group.total += location.count;
    group.cities.push(location);
    groups.set(location.country, group);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total);
}

export default async function GpusByCityPage() {
  const [locations, { t, intl }] = await Promise.all([getListingLocations(), getI18n()]);
  const c = t.citiesIndex;
  const countries = groupByCountry(locations);
  const cities = CITY_PAGES.map((city) => localizeCity(city, t));
  const [homeUrl, pageUrl] = await Promise.all([absoluteUrl("/"), absoluteUrl("/gpus-by-city")]);
  const cityUrls = await Promise.all(cities.map((city) => absoluteUrl(`/${city.slug}`)));

  const countFor = (apiCity: string, country: string) =>
    locations
      .filter((l) => l.city.toLowerCase() === apiCity.toLowerCase() && l.country === country)
      .reduce((sum, l) => sum + l.count, 0);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: homeUrl },
          { "@type": "ListItem", position: 2, name: c.breadcrumb, item: pageUrl },
        ],
      },
      {
        "@type": "ItemList",
        name: c.cityGuides,
        itemListElement: cities.map((city, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: fmt(c.buyUsedIn, { city: city.name }),
          url: cityUrls[i],
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <PageHeader
        eyebrow={c.eyebrow}
        title={<>{c.titleStart} <em>{c.titleEm}</em></>}
        description={c.description}
      />

      <section aria-labelledby="city-guides-heading" className="container mx-auto px-4 py-14 sm:px-6 lg:px-8">
        <h2 id="city-guides-heading" className="mb-6 font-display text-4xl leading-none tracking-[-0.02em] md:text-5xl">
          {c.cityGuides}
        </h2>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {cities.map((city) => {
            const count = countFor(city.apiCity, city.country);
            return (
              <li key={city.slug}>
                <Link
                  href={`/${city.slug}`}
                  className="card-hover group flex h-full flex-col rounded-2xl border border-border bg-card p-5"
                >
                  <CityLandmark
                    landmark={city.landmark}
                    label={`${city.landmarkName}, ${city.name}`}
                    className="mx-auto h-24 w-24 text-foreground/70 transition-colors group-hover:text-foreground"
                  />
                  <span className="mt-4 font-display text-2xl leading-none">{city.name}</span>
                  <span className="mt-1 text-xs text-muted-foreground">{city.regionLabel}</span>
                  {count > 0 && (
                    <span className="mt-3 font-mono text-xs tabular-nums text-foreground/80">
                      {count} {count === 1 ? t.search.listingOne : t.search.listingMany}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="all-locations-heading" className="border-t border-border bg-secondary/40 py-14 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="all-locations-heading" className="mb-8 font-display text-4xl leading-none tracking-[-0.02em] md:text-5xl">
            {c.allLocations}
          </h2>

          {countries.length > 0 ? (
            <div className="space-y-12">
              {countries.map((group) => (
                <div key={group.country}>
                  <h3 className="mb-4 flex items-baseline gap-3 border-b border-border pb-3">
                    <span className="font-display text-3xl">{countryName(group.country, intl)}</span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {group.total} {group.total === 1 ? t.search.listingOne : t.search.listingMany}
                    </span>
                  </h3>
                  <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
                    {group.cities.map((location) => (
                      <li key={`${location.city}|${location.region}`}>
                        <Link
                          href={locationHref(location)}
                          className="group flex items-baseline justify-between gap-3 border-b border-border/60 py-2.5 text-sm"
                        >
                          <span className="truncate transition-colors group-hover:text-accent">
                            {location.city}
                            {location.region && <span className="text-muted-foreground">, {location.region}</span>}
                          </span>
                          <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{location.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border px-6 py-14 text-center">
              <p className="font-display text-3xl">{c.unavailableTitle}</p>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                {c.unavailableBody}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button asChild variant="outline"><Link href="/gpus">{c.browseAll}</Link></Button>
                <Button asChild variant="accent">
                  <Link href="/request">{c.requestHardware} <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section data-nav="dark" className="dark bg-background py-16 text-foreground md:py-20">
        <div className="container mx-auto flex flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-end lg:px-8">
          <div>
            <h2 className="font-display text-4xl leading-tight md:text-5xl">{c.noCityTitle}</h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              {c.noCityBody}
            </p>
          </div>
          <Button asChild size="lg" variant="accent">
            <Link href="/request">
              {c.requestHardwareLower}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
