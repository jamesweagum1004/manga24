"use client";

export function ReaderControls({ visible, dataSaver, onToggleDataSaver, onTop }: { visible: boolean; dataSaver: boolean; onToggleDataSaver: () => void; onTop: () => void }) {
  return (
    <div className={`fixed bottom-5 right-4 z-50 flex items-center gap-2 transition ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`} onClick={(event) => event.stopPropagation()}>
      <button type="button" aria-pressed={dataSaver} onClick={onToggleDataSaver} className="rounded-full border border-white/15 bg-black/85 px-3 py-3 text-[10px] font-black uppercase text-white shadow-lg">
        Data {dataSaver ? "save" : "auto"}
      </button>
      <button type="button" aria-label="Scroll to top" onClick={onTop} className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-black text-white shadow-lg">↑</button>
    </div>
  );
}
