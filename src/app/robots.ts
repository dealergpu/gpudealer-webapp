import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Private, per-user or auth-only routes — nothing useful to index.
const DISALLOW = ["/dashboard", "/account/", "/listing/*/edit", "/auth/", "/sign-in", "/sign-up"];

// AI / LLM crawlers, allowed explicitly. Some only honour a group that names
// them, and a named group replaces `*` entirely — so each repeats DISALLOW.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "Meta-ExternalAgent",
  "MistralAI-User",
  "DuckAssistBot",
  "cohere-ai",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: ["/", "/llms.txt"], disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
