import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContactDialog } from "@/components/contact/ContactDialog";
import { SITE_NAME } from "@/lib/site";

const DESCRIPTION =
  "GPUDealer doesn't sell or ship hardware. Returns are handled under the policy of the platform or seller where the item is listed.";

const LAST_UPDATED = "October 28, 2026";

export const metadata: Metadata = {
  title: "Return Policy",
  description: DESCRIPTION,
  alternates: { canonical: "/return-policy" },
  openGraph: { title: `Return Policy | ${SITE_NAME}`, description: DESCRIPTION, url: "/return-policy" },
};

const sections = [
  {
    heading: "GPUDealer doesn't sell or ship hardware",
    body: (
      <>
        <p>
          GPUDealer is a discovery platform for used GPUs, AI servers, memory and other compute hardware. We don&apos;t
          own the inventory shown on the site, we don&apos;t process payments, and we don&apos;t ship items. Because
          no purchase is made through GPUDealer, we can&apos;t accept returns, issue refunds or exchange items.
        </p>
      </>
    ),
  },
  {
    heading: "Listings from other marketplaces",
    body: (
      <>
        <p>
          Many listings are aggregated from third-party marketplaces such as eBay, Facebook Marketplace and Reddit. Each
          of these listings shows its source and links to the original listing.
        </p>
        <p>
          If you buy one of these items, the purchase happens on that platform, so returns, refunds, disputes and buyer
          protection follow that platform&apos;s policies and the seller&apos;s terms there. Check the original
          listing&apos;s return terms before you buy, and contact the seller or the platform directly for any return.
        </p>
      </>
    ),
  },
  {
    heading: "Listings posted on GPUDealer",
    body: (
      <>
        <p>
          Some listings are posted directly by sellers on GPUDealer. Any sale that results from these listings is
          arranged between you and the seller, and GPUDealer isn&apos;t a party to it. Return terms are whatever you
          and the seller agree to, so confirm them in writing before you pay.
        </p>
      </>
    ),
  },
  {
    heading: "Before you buy",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Read the return and refund terms on the original listing.</li>
        <li>Confirm the condition, testing history and exact model with the seller.</li>
        <li>Prefer payment methods and platforms that offer buyer protection.</li>
        <li>Keep records of the listing, your messages and your payment.</li>
      </ul>
    ),
  },
  {
    heading: "Changes to this policy",
    body: (
      <p>
        If GPUDealer starts processing transactions or shipping hardware, we&apos;ll update this policy before those
        features launch.
      </p>
    ),
  },
];

export default function ReturnPolicyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title={<>Return <em>policy.</em></>} description={DESCRIPTION} />

      <section className="container mx-auto px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-10 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Last updated {LAST_UPDATED}
          </p>

          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="mb-3 font-display text-3xl leading-tight tracking-[-0.01em]">{section.heading}</h2>
                <div className="space-y-3 text-muted-foreground">{section.body}</div>
              </div>
            ))}

            <div>
              <h2 className="mb-3 font-display text-3xl leading-tight tracking-[-0.01em]">Questions</h2>
              <p className="text-muted-foreground">
                If you think a listing is misleading, or you have questions about this policy,{" "}
                <ContactDialog>
                  <button type="button" className="text-foreground underline underline-offset-4 hover:no-underline">
                    contact us
                  </button>
                </ContactDialog>
                . Looking for something specific?{" "}
                <Link href="/request" className="text-foreground underline underline-offset-4 hover:no-underline">
                  Request hardware
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
