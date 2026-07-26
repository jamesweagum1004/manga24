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
    <div className="mb-3 flex min-w-0 items-center gap-2">
      <h2 className="truncate text-[19px] font-black leading-6 sm:text-[21px]">{title}</h2>
      {badge ? (
        <span className="shrink-0 rounded-full bg-[var(--surface-strong)] px-2 py-1 text-[10px] font-black uppercase text-[var(--muted)]">
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
