export function UpdateBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-[var(--accent)] px-1.5 text-[10px] font-black leading-none text-white">
      {label}
    </span>
  );
}
