import type { Locale } from "@/lib/i18n";

export const homeSectionSources = ["popular", "latest", "adult", "tag", "manhwa"] as const;
export type HomeSectionSource = (typeof homeSectionSources)[number];

export type HomeSection = {
  id: string;
  title: string;
  subtitle: string;
  source: HomeSectionSource;
  tag: string;
  itemCount: number;
  enabled: boolean;
};

export const defaultHomeSections: HomeSection[] = [
  { id: "trending-manga", title: "Trending Manga", subtitle: "Live", source: "popular", tag: "", itemCount: 12, enabled: true },
  { id: "trending-adult", title: "Trending Adult Manga", subtitle: "18+", source: "adult", tag: "", itemCount: 12, enabled: true },
  { id: "romance", title: "Romance", subtitle: "Updated", source: "tag", tag: "romance", itemCount: 12, enabled: true },
  { id: "fantasy", title: "Fantasy", subtitle: "New arcs", source: "tag", tag: "fantasy", itemCount: 12, enabled: true },
  { id: "latest-updates", title: "Latest Updates", subtitle: "Last 6 hours", source: "latest", tag: "", itemCount: 12, enabled: true },
  { id: "popular-week", title: "Popular This Week", subtitle: "Weekly", source: "popular", tag: "", itemCount: 12, enabled: true },
  { id: "new-releases", title: "New Releases", subtitle: "Fresh", source: "latest", tag: "", itemCount: 12, enabled: true },
  { id: "manhwa-spotlight", title: "Manhwa Spotlight", subtitle: "Korean comics", source: "manhwa", tag: "", itemCount: 12, enabled: true }
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
      enabled: input.enabled !== false
    } satisfies HomeSection];
  });
  return sections.length > 0 ? sections.slice(0, 30) : defaultHomeSections;
}

export function homeSectionHref(locale: Locale, section: HomeSection) {
  if (section.source === "tag" && section.tag) return `/${locale}/tags/${section.tag}`;
  if (section.source === "latest") return `/${locale}/latest`;
  return `/${locale}/popular`;
}
