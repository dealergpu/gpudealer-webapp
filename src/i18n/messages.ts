import type { Locale } from "./config";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

/**
 * The shape of every locale file. `en.json` is the source of truth: adding a
 * key there without adding it to `zh.json` fails the typecheck below.
 */
export type Messages = typeof en;

const zhMessages: Messages = zh;

export const MESSAGES: Record<Locale, Messages> = { en, zh: zhMessages };
