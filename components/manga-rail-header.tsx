import Link from "next/link";
import { HorizontalScrollControls } from "./horizontal-scroll-controls";

export function MangaRailHeader({
  title,
  badge,
  href,
  onPrevious,
  onNext
}: {
  title: string;
  badge?: string;
  href?: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mb-4 flex min-w-0 items-center gap-2">
      <span className="h-5 w-1 shrink-0 rounded-full bg-[var(--accent)] md:hidden" aria-hidden="true" />
      <h2 className="truncate text-[20px] font-black leading-6 tracking-[-0.025em] sm:text-[21px] lg:text-[25px] lg:tracking-[-0.03em]">{title}</h2>
      {badge ? (
        <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--accent)_9%,var(--surface))] px-2 py-1 text-[10px] font-black uppercase text-[var(--accent)]">
          {badge}
        </span>
      ) : null}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {href ? (
          <Link href={href} className="text-xs font-black text-[var(--accent)] sm:text-sm" aria-label={`View all ${title}`}>
            View all
          </Link>
        ) : null}
        <HorizontalScrollControls label={title} onPrevious={onPrevious} onNext={onNext} />
      </div>
    </div>
  );
}
