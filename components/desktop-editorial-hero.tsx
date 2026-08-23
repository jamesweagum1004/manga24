import { ContentImage as Image } from "@/components/content-image";
import Link from "next/link";
import type { DemoTitle } from "@/lib/demo-data";
import type { Locale } from "@/lib/i18n";
import { localizedPath } from "@/lib/routes";

export function DesktopEditorialHero({
  featured,
  ranking,
  locale,
  showViewCounts = true
}: {
  featured: DemoTitle;
  ranking: DemoTitle[];
  locale: Locale;
  showViewCounts?: boolean;
}) {
  const latestChapter = featured.chapters.at(-1);
  const labels = locale === "en"
    ? { eyebrow: "Editor’s spotlight", read: "Start reading", ranking: "Weekly ranking", live: "Updated live" }
    : { eyebrow: "Selección editorial", read: "Empezar a leer", ranking: "Ranking semanal", live: "Actualizado" };

  return (
    <section className="hidden grid-cols-[minmax(0,1.65fr)_minmax(340px,0.75fr)] gap-4 lg:grid" aria-label="Featured titles">
      <article className="group relative min-h-[480px] overflow-hidden rounded-[28px] bg-[#17191c] text-white shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
        <Image
          src={featured.cover.src}
          alt=""
          fill
          sizes="(min-width: 1280px) 920px, 65vw"
          className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.025]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,11,14,0.96)_0%,rgba(9,11,14,0.78)_42%,rgba(9,11,14,0.12)_78%),linear-gradient(0deg,rgba(9,11,14,0.72),transparent_55%)]" />
        <div className="relative flex min-h-[480px] max-w-[58%] flex-col justify-end p-10 xl:p-12">
          <div className="mb-auto flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/75">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            {labels.eyebrow}
          </div>
          <p className="mb-3 text-sm font-bold text-white/70">{featured.author} · {featured.publicationStatus}</p>
          <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.055em] xl:text-6xl">{featured.titles[locale]}</h1>
          <p className="mt-5 line-clamp-3 max-w-2xl text-base font-medium leading-7 text-white/75">{featured.descriptions[locale]}</p>
          <div className="mt-7 flex items-center gap-3">
            <Link
              href={localizedPath(locale, `/manga/${featured.slug}`)}
              className="rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-black text-white transition-transform hover:-translate-y-0.5"
            >
              {labels.read}
            </Link>
            {latestChapter ? <span className="text-sm font-bold text-white/65">{latestChapter.titles[locale]}</span> : null}
          </div>
        </div>
      </article>

      <aside className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_55px_rgba(15,23,42,0.08)] xl:p-7">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">Manga24 chart</p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.045em]">{labels.ranking}</h2>
          </div>
          <span className="mb-1 text-xs font-bold text-[var(--muted)]">{labels.live}</span>
        </div>
        <ol className="divide-y divide-[var(--border)]">
          {ranking.slice(0, 5).map((title, index) => (
            <li key={title.slug}>
              <Link href={localizedPath(locale, `/manga/${title.slug}`)} className="group flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <span className="w-7 text-center text-2xl font-black tabular-nums text-[var(--muted)] group-hover:text-[var(--accent)]">{index + 1}</span>
                <div className="relative h-[72px] w-[54px] shrink-0 overflow-hidden rounded-lg bg-[var(--surface-strong)]">
                  <Image src={title.cover.src} alt={title.cover.alt} fill sizes="54px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black">{title.titles[locale]}</h3>
                  <p className="mt-1 truncate text-xs font-bold text-[var(--muted)]">{title.author}</p>
                  {showViewCounts ? <p className="mt-1 text-[11px] font-black text-[var(--accent)]">{formatViews(title.viewCount)} views</p> : null}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </aside>
    </section>
  );
}

function formatViews(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
