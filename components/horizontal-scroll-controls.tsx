"use client";

export function HorizontalScrollControls({
  onPrevious,
  onNext,
  label
}: {
  onPrevious: () => void;
  onNext: () => void;
  label: string;
}) {
  return (
    <div className="hidden items-center gap-1 md:flex">
      <button
        type="button"
        aria-label={`Previous ${label}`}
        onClick={onPrevious}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-black hover:border-[var(--accent)]"
      >
        {"<"}
      </button>
      <button
        type="button"
        aria-label={`Next ${label}`}
        onClick={onNext}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-black hover:border-[var(--accent)]"
      >
        {">"}
      </button>
    </div>
  );
}
