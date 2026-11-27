import { Link } from "@/i18n/navigation";
import { alternatesFor, getI18n, localizedHref } from "@/i18n/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContactDialog } from "@/components/contact/ContactDialog";
import { SITE_NAME } from "@/lib/site";
import { fmt } from "@/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  const r = t.returnPolicy;
  return {
    title: r.metaTitle,
    description: r.description,
    alternates: await alternatesFor("/return-policy"),
    openGraph: { title: `${r.metaTitle} | ${SITE_NAME}`, description: r.description, url: await localizedHref("/return-policy") },
  };
}

export default async function ReturnPolicyPage() {
  const { t } = await getI18n();
  const r = t.returnPolicy;
  const sections = [
    { heading: r.s1Heading, body: <p>{r.s1Body}</p> },
    { heading: r.s2Heading, body: <><p>{r.s2Body1}</p><p>{r.s2Body2}</p></> },
    { heading: r.s3Heading, body: <p>{r.s3Body}</p> },
    {
      heading: r.s4Heading,
      body: (
        <ul className="list-disc space-y-2 pl-5">
          {r.s4Items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ),
    },
    { heading: r.s5Heading, body: <p>{r.s5Body}</p> },
  ];

  return (
    <>
      <PageHeader eyebrow={r.eyebrow} title={<>{r.titleStart} <em>{r.titleEm}</em></>} description={r.description} />

      <section className="container mx-auto px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-10 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {fmt(r.lastUpdated, { date: r.lastUpdatedDate })}
          </p>

          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="mb-3 font-display text-3xl leading-tight tracking-[-0.01em]">{section.heading}</h2>
                <div className="space-y-3 text-muted-foreground">{section.body}</div>
              </div>
            ))}

            <div>
              <h2 className="mb-3 font-display text-3xl leading-tight tracking-[-0.01em]">{r.questions}</h2>
              <p className="text-muted-foreground">
                {r.questionsStart}{" "}
                <ContactDialog>
                  <button type="button" className="text-foreground underline underline-offset-4 hover:no-underline">
                    {r.contactUs}
                  </button>
                </ContactDialog>
                {r.lookingFor}{" "}
                <Link href="/request" className="text-foreground underline underline-offset-4 hover:no-underline">
                  {r.requestHardware}
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
