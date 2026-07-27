import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { DemoTitle } from "@/lib/demo-data";
import { localizedPath } from "@/lib/routes";

export function MangaCard({ title, locale, priority = false }: { title: DemoTitle; locale: Locale; priority?: boolean }) {
  const latestChapter = title.chapters.at(-1);

  return (
    <article className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <Link href={localizedPath(locale, `/manga/${title.slug}`)} className="block">
        <div className="relative aspect-[2/3] bg-[var(--surface-strong)]">
          <Image
            src={title.cover.src}
            alt={title.cover.alt}
            fill
            sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw"
            className="object-cover"
            priority={priority}
          />
        </div>
        <div className="space-y-2 p-3">
          <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5">{title.titles[locale]}</h3>
          <p className="text-xs font-semibold text-[var(--muted)]">
            {latestChapter ? latestChapter.titles[locale] : "No chapters"}
          </p>
        </div>
      </Link>
    </article>
  );
}
