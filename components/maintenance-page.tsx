import type { Locale } from "@/lib/i18n";

const copy: Record<Locale, { eyebrow: string; title: string; message: string; note: string }> = {
  en: { eyebrow: "Scheduled maintenance", title: "We’ll be right back", message: "Manga24 is being updated to improve your reading experience.", note: "Please try again in a few minutes." },
  es: { eyebrow: "Mantenimiento programado", title: "Volveremos enseguida", message: "Estamos actualizando Manga24 para mejorar tu experiencia de lectura.", note: "Vuelve a intentarlo en unos minutos." },
  fr: { eyebrow: "Maintenance programmée", title: "Nous revenons bientôt", message: "Manga24 est en cours de mise à jour pour améliorer votre lecture.", note: "Veuillez réessayer dans quelques minutes." },
  de: { eyebrow: "Geplante Wartung", title: "Wir sind gleich zurück", message: "Manga24 wird aktualisiert, um dein Leseerlebnis zu verbessern.", note: "Bitte versuche es in einigen Minuten erneut." },
  pt: { eyebrow: "Manutenção programada", title: "Voltamos em breve", message: "O Manga24 está sendo atualizado para melhorar sua experiência de leitura.", note: "Tente novamente em alguns minutos." }
};

export function MaintenancePage({ locale }: { locale: Locale }) {
  const text = copy[locale];
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-16">
      <section className="w-full max-w-xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-xl sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)] text-xl font-black text-white shadow-lg">M24</div>
        <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-[var(--accent)]">{text.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">{text.title}</h1>
        <p className="mx-auto mt-4 max-w-md text-base font-bold leading-7 text-[var(--muted)]">{text.message}</p>
        <p className="mt-6 text-sm font-bold">{text.note}</p>
      </section>
    </main>
  );
}
