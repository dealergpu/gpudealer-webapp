/**
 * City landing pages (/buy-gpu-in-<city>) — static SEO pages whose listings
 * load live from the API. Each city carries its own copy so the pages aren't
 * thin duplicates of one another.
 */

export type CityLandmark = "cn-tower" | "calgary-tower" | "olympic-stadium" | "tower-bridge" | "willis-tower" | "statue-of-liberty";

export type CityPage = {
  /** URL slug: the page lives at `/${slug}`. */
  slug: string;
  name: string;
  /** Region shown next to the name, e.g. "Ontario, Canada". */
  regionLabel: string;
  /**
   * Exact value for the API's `city` filter. Matching is case-insensitive but
   * accent-sensitive, so it must be spelled the way listings store it
   * (Montréal, not Montreal).
   */
  apiCity: string;
  /** ISO 3166-1 alpha-2, sent as the API's `country` filter. */
  country: "CA" | "US" | "GB";
  landmark: CityLandmark;
  landmarkName: string;
  intro: string;
  sections: { heading: string; body: string }[];
  faqs: { q: string; a: string }[];
};

export const CITY_PAGES: CityPage[] = [
  {
    slug: "buy-gpu-in-toronto",
    name: "Toronto",
    regionLabel: "Ontario, Canada",
    apiCity: "Toronto",
    country: "CA",
    landmark: "cn-tower",
    landmarkName: "CN Tower",
    intro:
      "Find the best used GPU deals in Toronto — RTX 3090s, 4090s, 5090s, workstation cards and data-center GPUs listed by sellers across the GTA.",
    sections: [
      {
        heading: "Used GPUs for Toronto's AI scene",
        body: "Toronto is one of North America's busiest AI research hubs, home to the Vector Institute and a deep bench of startups training and serving models. That makes it a strong market for 24GB-and-up cards — buyers here are often after VRAM first, so filter by memory and compare price per GB.",
      },
      {
        heading: "Buy locally, skip the cross-border hassle",
        body: "Buying from a seller in Toronto means no customs brokerage fees on a US shipment and no waiting on a courier. For high-value cards, meeting locally lets you see the card running before money changes hands.",
      },
    ],
    faqs: [
      {
        q: "Can I test a used GPU before buying in Toronto?",
        a: "Many local sellers are happy to demo a card under load. Ask to see it run a benchmark or a few minutes of a stress test, and check temperatures and fan noise.",
      },
      {
        q: "What if no one in Toronto has the GPU I need?",
        a: "Post a hardware request with the model, quantity, budget and delivery location. GPUDealer searches its wider supply network across Canada and the US.",
      },
    ],
  },
  {
    slug: "buy-gpu-in-calgary",
    name: "Calgary",
    regionLabel: "Alberta, Canada",
    apiCity: "Calgary",
    country: "CA",
    landmark: "calgary-tower",
    landmarkName: "Calgary Tower",
    intro:
      "Find the best used GPU deals in Calgary — gaming flagships, workstation cards and AI-ready GPUs from sellers across the city.",
    sections: [
      {
        heading: "A growing market for compute hardware",
        body: "Calgary's tech sector has grown quickly, and with it the number of people building local AI rigs and small render or inference boxes. Used high-VRAM cards are the most cost-effective way in, and local listings let you compare condition and price side by side.",
      },
      {
        heading: "Buy from a Calgary seller",
        body: "A local deal means no long-haul shipping risk on a heavy, fragile card. Meeting in person also lets you confirm the exact model, check the PCB and power connectors, and see the card running.",
      },
    ],
    faqs: [
      {
        q: "Are used GPUs in Calgary a good deal?",
        a: "Often, yes — especially previous-generation 24GB cards, which still handle many AI workloads well. Compare listings by VRAM and price per unit before you buy.",
      },
      {
        q: "Can GPUDealer source GPUs to Calgary in bulk?",
        a: "Submit a hardware request with the quantity and budget. Multi-GPU requests are exactly what our supply network is built to match.",
      },
    ],
  },
  {
    slug: "buy-gpu-in-montreal",
    name: "Montréal",
    regionLabel: "Québec, Canada",
    apiCity: "Montréal",
    country: "CA",
    landmark: "olympic-stadium",
    landmarkName: "Olympic Stadium tower",
    intro:
      "Find the best used GPU deals in Montréal — RTX cards, workstation GPUs and AI hardware from sellers across the island and the greater Montréal area.",
    sections: [
      {
        heading: "GPUs for one of the world's deep-learning capitals",
        body: "Montréal is home to Mila, one of the largest academic deep-learning research institutes in the world, and a dense cluster of AI labs around it. Researchers and students here need serious VRAM on a budget — which is exactly where the used market shines.",
      },
      {
        heading: "Local deals, fewer surprises",
        body: "Buying from a Montréal seller avoids cross-border shipping and import fees, and lets you inspect a card before paying. For multi-GPU builds, local supply also makes it easier to match identical models.",
      },
    ],
    faqs: [
      {
        q: "What GPU is best for AI research on a budget?",
        a: "Used 24GB cards such as the RTX 3090 remain popular for their VRAM per dollar. If you need more memory, look at 48GB workstation cards like the RTX A6000.",
      },
      {
        q: "Can I request a specific GPU in Montréal?",
        a: "Yes — post a hardware request with the model, quantity and budget, and we'll look for matching supply.",
      },
    ],
  },
  {
    slug: "buy-gpu-in-london",
    name: "London",
    regionLabel: "England, United Kingdom",
    apiCity: "London",
    country: "GB",
    landmark: "tower-bridge",
    landmarkName: "Tower Bridge",
    intro:
      "Find all the great used GPU deals in London — RTX 4090s, 5090s, workstation cards and data-center GPUs from sellers across Greater London.",
    sections: [
      {
        heading: "Hardware for Europe's largest AI hub",
        body: "London hosts Google DeepMind and one of Europe's largest concentrations of AI startups and research teams. Demand for high-VRAM GPUs is strong, and the used market is often the fastest way to get cards in hand without long lead times.",
      },
      {
        heading: "Why buy from a London seller",
        body: "Buying within the UK avoids import VAT and customs charges on hardware shipped from abroad. A local seller also means you can collect in person and confirm the card works before you pay.",
      },
    ],
    faqs: [
      {
        q: "Do I pay import fees on a used GPU bought in London?",
        a: "Not when buying from a seller already in the UK. Import VAT and duty apply to hardware shipped in from outside the UK.",
      },
      {
        q: "Can GPUDealer source multiple GPUs for a London team?",
        a: "Submit a hardware request with the model, quantity, budget and timeline. Bulk requests are a priority for our supply network.",
      },
    ],
  },
  {
    slug: "buy-gpu-in-chicago",
    name: "Chicago",
    regionLabel: "Illinois, USA",
    apiCity: "Chicago",
    country: "US",
    landmark: "willis-tower",
    landmarkName: "Willis Tower",
    intro:
      "Find the best used GPU deals in Chicago — consumer flagships, workstation cards and AI hardware from sellers across Chicagoland.",
    sections: [
      {
        heading: "A major data-center market",
        body: "Chicago is one of the largest data-center markets in the United States, which means a steady flow of enterprise hardware cycling out of service alongside consumer and workstation cards. It's a good place to look for both single GPUs and multi-GPU servers.",
      },
      {
        heading: "Pick up locally",
        body: "A local purchase avoids shipping damage on heavy cards and servers. Meeting a Chicago seller in person lets you verify the model and see the hardware running before you pay.",
      },
    ],
    faqs: [
      {
        q: "Where can I buy a used GPU server in Chicago?",
        a: "Browse current listings on this page, or post a hardware request with the GPU count, model and budget if nothing matches yet.",
      },
      {
        q: "How do I check a used GPU before buying?",
        a: "Ask the seller to run a stress test, watch temperatures and clocks, and confirm the model and VRAM in a tool like GPU-Z or nvidia-smi.",
      },
    ],
  },
  {
    slug: "buy-gpu-in-new-york",
    name: "New York",
    regionLabel: "New York, USA",
    apiCity: "New York",
    country: "US",
    landmark: "statue-of-liberty",
    landmarkName: "Statue of Liberty",
    intro:
      "Find the best used GPU deals in New York — RTX cards, workstation GPUs and AI hardware from sellers across the five boroughs.",
    sections: [
      {
        heading: "GPUs for New York's AI and finance teams",
        body: "New York's mix of AI startups, quant and finance firms and media studios creates steady demand for high-end GPUs. Used cards are a fast way to add compute without waiting on new-hardware allocation.",
      },
      {
        heading: "Buy in the city",
        body: "A local seller means no shipping delays or damage risk, and the chance to see the card running before you pay. For larger purchases, it's easier to verify every unit in person.",
      },
    ],
    faqs: [
      {
        q: "Is it safe to buy a used GPU in New York?",
        a: "Meet in a public place, test the card under load before paying, and confirm the model and VRAM match the listing. Every listing on GPUDealer shows where it came from.",
      },
      {
        q: "Can't find the GPU you want in New York?",
        a: "Post a hardware request with the model, quantity and budget, and GPUDealer will look across its supply network.",
      },
    ],
  },
];

export function getCityPage(slug: string): CityPage | undefined {
  return CITY_PAGES.find((city) => city.slug === slug);
}
