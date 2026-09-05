import type { Locale } from "@/lib/i18n";

export const homeSectionSources = ["popular", "live", "random", "popular_period", "latest", "adult", "tag", "manhwa"] as const;
export const popularityPeriods = ["hourly", "custom", "daily"] as const;
export type HomeSectionSource = (typeof homeSectionSources)[number];
export type PopularityPeriod = (typeof popularityPeriods)[number];

export type HomeSection = {
  id: string;
  title: string;
  subtitle: string;
  source: HomeSectionSource;
  tag: string;
  itemCount: number;
  enabled: boolean;
  popularityPeriod: PopularityPeriod;
  customHours: number;
  localizations?: Partial<Record<Locale, { title: string; subtitle: string }>>;
};

export const defaultHomeSections: HomeSection[] = [
  { id: "trending-manga", title: "Trending Manga", subtitle: "Live", source: "live", tag: "", itemCount: 12, enabled: true, popularityPeriod: "hourly", customHours: 6 },
  { id: "trending-adult", title: "Trending Adult Manga", subtitle: "18+", source: "adult", tag: "", itemCount: 12, enabled: true, popularityPeriod: "hourly", customHours: 6 },
  { id: "romance", title: "Romance", subtitle: "Updated", source: "tag", tag: "romance", itemCount: 12, enabled: true, popularityPeriod: "hourly", customHours: 6 },
  { id: "fantasy", title: "Fantasy", subtitle: "New arcs", source: "tag", tag: "fantasy", itemCount: 12, enabled: true, popularityPeriod: "hourly", customHours: 6 },
  { id: "latest-updates", title: "Latest Updates", subtitle: "Last 6 hours", source: "latest", tag: "", itemCount: 12, enabled: true, popularityPeriod: "hourly", customHours: 6 },
  { id: "popular-week", title: "Popular Today", subtitle: "Daily", source: "popular_period", tag: "", itemCount: 12, enabled: true, popularityPeriod: "daily", customHours: 24 },
  { id: "new-releases", title: "New Releases", subtitle: "Fresh", source: "latest", tag: "", itemCount: 12, enabled: true, popularityPeriod: "hourly", customHours: 6 },
  { id: "manhwa-spotlight", title: "Manhwa Spotlight", subtitle: "Korean comics", source: "manhwa", tag: "", itemCount: 12, enabled: true, popularityPeriod: "hourly", customHours: 6 }
];

export function normalizeHomeSections(value: unknown): HomeSection[] {
  if (!Array.isArray(value)) return defaultHomeSections;
  const sections = value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const input = item as Record<string, unknown>;
    const source = homeSectionSources.includes(input.source as HomeSectionSource) ? input.source as HomeSectionSource : "latest";
    const title = typeof input.title === "string" ? input.title.trim().slice(0, 80) : "";
    if (!title) return [];
    return [{
      id: typeof input.id === "string" && /^[a-z0-9-]{1,80}$/u.test(input.id) ? input.id : `section-${index + 1}`,
      title,
      subtitle: typeof input.subtitle === "string" ? input.subtitle.trim().slice(0, 80) : "",
      source,
      tag: typeof input.tag === "string" ? input.tag.trim().toLowerCase().slice(0, 80) : "",
      itemCount: typeof input.itemCount === "number" && Number.isInteger(input.itemCount) ? Math.min(30, Math.max(1, input.itemCount)) : 12,
      enabled: input.enabled !== false,
      popularityPeriod: popularityPeriods.includes(input.popularityPeriod as PopularityPeriod) ? input.popularityPeriod as PopularityPeriod : "hourly",
      customHours: typeof input.customHours === "number" && Number.isInteger(input.customHours) ? Math.min(168, Math.max(1, input.customHours)) : 6
      ,localizations: normalizeLocalizations(input.localizations, title, typeof input.subtitle === "string" ? input.subtitle.trim().slice(0, 80) : "")
    } satisfies HomeSection];
  });
  return sections.length > 0 ? sections.slice(0, 30) : defaultHomeSections;
}

function normalizeLocalizations(value: unknown, title: string, subtitle: string) {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries((["en", "es", "fr", "de", "pt"] as Locale[]).flatMap((locale) => {
    const item = input[locale];
    if (!item || typeof item !== "object") return locale === "en" ? [[locale, { title, subtitle }]] : [];
    const fields = item as Record<string, unknown>;
    const localizedTitle = typeof fields.title === "string" ? fields.title.trim().slice(0, 80) : "";
    return localizedTitle ? [[locale, { title: localizedTitle, subtitle: typeof fields.subtitle === "string" ? fields.subtitle.trim().slice(0, 80) : "" }]] : [];
  }));
}

export function localizedHomeSection(section: HomeSection, locale: Locale) {
  return section.localizations?.[locale] ?? { title: section.title, subtitle: section.subtitle };
}

export function homeSectionHref(locale: Locale, section: HomeSection) {
  if (section.source === "tag" && section.tag) return `/${locale}/tags/${section.tag}`;
  if (section.source === "latest") return `/${locale}/latest`;
  return `/${locale}/popular`;
}
