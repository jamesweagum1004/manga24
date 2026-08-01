const steps = ["Basic info", "Cover", "Chapter", "Pages", "SEO & publish"];

export function TitleSetupSteps({ current }: { current: number }) {
  return (
    <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 overflow-x-auto">
        {steps.map((label, index) => {
          const number = index + 1;
          const active = number === current;
          const complete = number < current;
          return <div key={label} className="flex min-w-fit flex-1 items-center gap-2"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${active ? "bg-[var(--accent)] text-white" : complete ? "bg-green-600 text-white" : "bg-[var(--surface-strong)] text-[var(--muted)]"}`}>{complete ? "✓" : number}</span><span className={`text-xs font-black ${active ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}>{label}</span>{number < steps.length ? <span className="ml-auto h-px min-w-4 flex-1 bg-[var(--border)]" /> : null}</div>;
        })}
      </div>
    </section>
  );
}
