"use client";

export function ReaderControls({ visible, onTop }: { visible: boolean; onTop: () => void }) {
  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={onTop}
      className={`fixed bottom-5 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-black text-white shadow-lg transition ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      ^
    </button>
  );
}
