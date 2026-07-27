import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/demo-data";

export function EndOfChapter({ locale, nextHref }: { locale: Locale; nextHref?: string }) {
  const t = dictionary[locale];

  return (
    <section className="mx-auto max-w-[840px] px-4 py-12 text-center">
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-xl font-black text-white">{t.endOfChapter}</h2>
        <p className="mt-2 text-sm text-white/65">{nextHref ? t.nextChapter : t.noNextChapter}</p>
        {nextHref ? (
          <Link
            href={nextHref}
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-white"
          >
            {t.nextChapter}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
