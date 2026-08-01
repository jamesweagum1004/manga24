import { ContentImage as Image } from "@/components/content-image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { DemoTitle } from "@/lib/demo-data";
import { localizedPath } from "@/lib/routes";
import { UpdateBadge } from "./update-badge";

export function RankedMangaCard({
  title,
  locale,
  rank,
  priority = false,
  badge
}: {
  title: DemoTitle;
  locale: Locale;
  rank: number;
  priority?: boolean;
  badge?: string;
}) {
  const latestChapter = title.chapters.at(-1);

  return (
    <article className="w-[clamp(82px,21vw,94px)] shrink-0 snap-start md:w-32 lg:w-auto">
      <Link href={localizedPath(locale, `/manga/${title.slug}`)} className="group block rounded-lg focus-visible:outline-offset-4">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-[var(--surface-strong)] lg:rounded-xl lg:shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
          <Image
            src={title.cover.src}
            alt={title.cover.alt}
            fill
            sizes="(min-width: 1024px) 144px, (min-width: 768px) 128px, 94px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.035]"
            priority={priority}
          />
          <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-[11px] font-black text-white">
            {rank}
          </span>
          {badge ? (
            <span className="absolute right-1.5 top-1.5">
              <UpdateBadge label={badge} />
            </span>
          ) : null}
        </div>
        <h3 className="mt-1.5 line-clamp-2 min-h-8 text-[12px] font-black leading-4 sm:text-[13px]">{title.titles[locale]}</h3>
        <p className="mt-0.5 truncate text-[10px] font-bold leading-4 text-[var(--muted)] sm:text-[11px]">
          {latestChapter ? latestChapter.titles[locale] : "No updates"}
        </p>
      </Link>
    </article>
  );
}
