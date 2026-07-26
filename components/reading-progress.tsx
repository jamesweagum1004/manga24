"use client";

export function ReadingProgress({ progress }: { progress: number }) {
  return (
    <div aria-label={`Reading progress ${progress}%`} className="h-1 w-full bg-white/10">
      <div className="h-full bg-[var(--accent)] transition-[width]" style={{ width: `${progress}%` }} />
    </div>
  );
}
