import type { Locale } from "@/lib/i18n";

export type DemoAsset = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type DemoTag = {
  slug: string;
  names: Record<Locale, string>;
};

export type DemoChapter = {
  slug: string;
  number: number;
  titles: Record<Locale, string>;
  publishedAt: string;
  pages: DemoAsset[];
};

export type DemoTitle = {
  slug: string;
  originalTitle: string;
  titles: Record<Locale, string>;
  descriptions: Record<Locale, string>;
  cover: DemoAsset;
  author: string;
  originalLanguage: string;
  publicationStatus: "Ongoing" | "Completed" | "Hiatus";
  contentRating: "18+";
  tags: string[];
  publishedAt: string;
  viewCount: number;
  chapters: DemoChapter[];
};

export const dictionary = {
  en: {
    latest: "Latest",
    popular: "Popular",
    tags: "Tags",
    search: "Search",
    menu: "Menu",
    theme: "Theme",
    featured: "Featured Title",
    trending: "Trending",
    latestUpdates: "Latest Updates",
    popularTitles: "Popular Titles",
    popularTags: "Popular Tags",
    continueReading: "Continue Reading",
    readLatest: "Read Latest Chapter",
    startChapterOne: "Start from Chapter 1",
    bookmark: "Bookmark",
    chapters: "Chapters",
    author: "Author",
    status: "Status",
    language: "Language",
    chapterCount: "Chapters",
    views: "Views",
    previous: "Previous",
    next: "Next",
    chapterList: "Chapter List",
    endOfChapter: "End of Chapter",
    nextChapter: "Next Chapter",
    noNextChapter: "You are caught up.",
    admin: "Admin"
  },
  es: {
    latest: "Recientes",
    popular: "Populares",
    tags: "Etiquetas",
    search: "Buscar",
    menu: "Menu",
    theme: "Tema",
    featured: "Titulo destacado",
    trending: "Tendencias",
    latestUpdates: "Actualizaciones",
    popularTitles: "Titulos populares",
    popularTags: "Etiquetas populares",
    continueReading: "Continuar leyendo",
    readLatest: "Leer el ultimo capitulo",
    startChapterOne: "Empezar desde el capitulo 1",
    bookmark: "Guardar",
    chapters: "Capitulos",
    author: "Autor",
    status: "Estado",
    language: "Idioma",
    chapterCount: "Capitulos",
    views: "Vistas",
    previous: "Anterior",
    next: "Siguiente",
    chapterList: "Lista",
    endOfChapter: "Fin del capitulo",
    nextChapter: "Siguiente capitulo",
    noNextChapter: "Estas al dia.",
    admin: "Admin"
  }
} satisfies Record<Locale, Record<string, string>>;

export const demoTags: DemoTag[] = [
  { slug: "romance", names: { en: "Romance", es: "Romance" } },
  { slug: "drama", names: { en: "Drama", es: "Drama" } },
  { slug: "fantasy", names: { en: "Fantasy", es: "Fantasia" } },
  { slug: "slice-of-life", names: { en: "Slice of Life", es: "Vida cotidiana" } },
  { slug: "comedy", names: { en: "Comedy", es: "Comedia" } },
  { slug: "urban", names: { en: "Urban", es: "Urbano" } },
  { slug: "mystery", names: { en: "Mystery", es: "Misterio" } },
  { slug: "supernatural", names: { en: "Supernatural", es: "Sobrenatural" } }
];

const readerPages: DemoAsset[] = Array.from({ length: 8 }, (_, index) => ({
  id: `reader-${index + 1}`,
  src: `/placeholders/reader-${(index % 6) + 1}.svg`,
  alt: `Non-explicit synthetic manga panel page ${index + 1}`,
  width: 820,
  height: 1280
}));

function chaptersFor(titleSlug: string): DemoChapter[] {
  return [1, 2, 3, 4].map((number) => ({
    slug: `chapter-${number}`,
    number,
    titles: {
      en: `Chapter ${number}: ${["First Light", "Quiet Signal", "Open Door", "Late Return"][number - 1]}`,
      es: `Capitulo ${number}: ${["Primera luz", "Senal tranquila", "Puerta abierta", "Regreso tarde"][number - 1]}`
    },
    publishedAt: `2026-0${number + 2}-${String(number * 4).padStart(2, "0")}`,
    pages: readerPages.map((page, pageIndex) => ({
      ...page,
      id: `${titleSlug}-${number}-${pageIndex + 1}`,
      alt: `${titleSlug} chapter ${number} synthetic placeholder page ${pageIndex + 1}`
    }))
  }));
}

export const demoTitles: DemoTitle[] = [
  {
    slug: "midnight-atelier",
    originalTitle: "Midnight Atelier",
    titles: { en: "Midnight Atelier", es: "Atelier de Medianoche" },
    descriptions: {
      en: "A quiet painter discovers a hidden studio where unfinished memories become luminous panels. This demo series keeps all imagery abstract and non-explicit while testing the reader flow.",
      es: "Una pintora descubre un taller oculto donde los recuerdos inconclusos se vuelven paneles luminosos. Esta serie demo mantiene las imagenes abstractas y no explicitas."
    },
    cover: {
      id: "cover-atelier",
      src: "/placeholders/cover-atelier.svg",
      alt: "Abstract cover for Midnight Atelier",
      width: 640,
      height: 960
    },
    author: "Studio Mira",
    originalLanguage: "English",
    publicationStatus: "Ongoing",
    contentRating: "18+",
    tags: ["romance", "drama", "slice-of-life"],
    publishedAt: "2026-01-14",
    viewCount: 12400,
    chapters: chaptersFor("midnight-atelier")
  },
  {
    slug: "neon-shelter",
    originalTitle: "Neon Shelter",
    titles: { en: "Neon Shelter", es: "Refugio de Neon" },
    descriptions: {
      en: "Two night-shift neighbors build trust while protecting a rooftop garden in a rain-soaked city.",
      es: "Dos vecinos de turno nocturno construyen confianza mientras protegen un jardin sobre la ciudad."
    },
    cover: {
      id: "cover-neon",
      src: "/placeholders/cover-neon.svg",
      alt: "Abstract cover for Neon Shelter",
      width: 640,
      height: 960
    },
    author: "Arden Vale",
    originalLanguage: "English",
    publicationStatus: "Ongoing",
    contentRating: "18+",
    tags: ["drama", "urban", "romance"],
    publishedAt: "2026-02-21",
    viewCount: 18420,
    chapters: chaptersFor("neon-shelter")
  },
  {
    slug: "paper-moon-cafe",
    originalTitle: "Paper Moon Cafe",
    titles: { en: "Paper Moon Cafe", es: "Cafe Luna de Papel" },
    descriptions: {
      en: "A reserved baker and a touring musician trade letters, recipes, and second chances.",
      es: "Una repostera reservada y un musico de gira intercambian cartas, recetas y segundas oportunidades."
    },
    cover: {
      id: "cover-cafe",
      src: "/placeholders/cover-cafe.svg",
      alt: "Abstract cover for Paper Moon Cafe",
      width: 640,
      height: 960
    },
    author: "Lena Coast",
    originalLanguage: "English",
    publicationStatus: "Completed",
    contentRating: "18+",
    tags: ["slice-of-life", "comedy", "romance"],
    publishedAt: "2026-03-08",
    viewCount: 9630,
    chapters: chaptersFor("paper-moon-cafe")
  },
  {
    slug: "harbor-after-hours",
    originalTitle: "Harbor After Hours",
    titles: { en: "Harbor After Hours", es: "Puerto de Madrugada" },
    descriptions: {
      en: "A dockside repair crew solves small mysteries as fog rolls through the midnight market.",
      es: "Un equipo de reparaciones resuelve pequenos misterios cuando la niebla llega al mercado nocturno."
    },
    cover: {
      id: "cover-harbor",
      src: "/placeholders/cover-harbor.svg",
      alt: "Abstract cover for Harbor After Hours",
      width: 640,
      height: 960
    },
    author: "Nico Est",
    originalLanguage: "English",
    publicationStatus: "Hiatus",
    contentRating: "18+",
    tags: ["mystery", "urban", "drama"],
    publishedAt: "2026-04-11",
    viewCount: 7810,
    chapters: chaptersFor("harbor-after-hours")
  },
  {
    slug: "silver-rain-room",
    originalTitle: "Silver Rain Room",
    titles: { en: "Silver Rain Room", es: "Sala de Lluvia Plateada" },
    descriptions: {
      en: "A restoration artist follows coded postcards to repair a forgotten theater.",
      es: "Una restauradora sigue postales cifradas para reparar un teatro olvidado."
    },
    cover: {
      id: "cover-rain",
      src: "/placeholders/cover-rain.svg",
      alt: "Abstract cover for Silver Rain Room",
      width: 640,
      height: 960
    },
    author: "Iris North",
    originalLanguage: "English",
    publicationStatus: "Ongoing",
    contentRating: "18+",
    tags: ["mystery", "romance", "drama"],
    publishedAt: "2026-05-03",
    viewCount: 14250,
    chapters: chaptersFor("silver-rain-room")
  },
  {
    slug: "soft-static",
    originalTitle: "Soft Static",
    titles: { en: "Soft Static", es: "Estatica Suave" },
    descriptions: {
      en: "A radio archivist curates anonymous messages that begin to form one connected story.",
      es: "Una archivista de radio ordena mensajes anonimos que empiezan a formar una historia conectada."
    },
    cover: {
      id: "cover-static",
      src: "/placeholders/cover-static.svg",
      alt: "Abstract cover for Soft Static",
      width: 640,
      height: 960
    },
    author: "Rowan Pike",
    originalLanguage: "English",
    publicationStatus: "Ongoing",
    contentRating: "18+",
    tags: ["slice-of-life", "urban", "comedy"],
    publishedAt: "2026-05-28",
    viewCount: 11200,
    chapters: chaptersFor("soft-static")
  },
  {
    slug: "glass-orbit",
    originalTitle: "Glass Orbit",
    titles: { en: "Glass Orbit", es: "Orbita de Cristal" },
    descriptions: {
      en: "A museum guide maps a floating archive where every exhibit changes after sunset.",
      es: "Una guia de museo traza un archivo flotante donde cada exhibicion cambia al atardecer."
    },
    cover: {
      id: "cover-orbit",
      src: "/placeholders/cover-orbit.svg",
      alt: "Abstract cover for Glass Orbit",
      width: 640,
      height: 960
    },
    author: "Mara Lin",
    originalLanguage: "English",
    publicationStatus: "Ongoing",
    contentRating: "18+",
    tags: ["fantasy", "mystery", "romance"],
    publishedAt: "2026-06-02",
    viewCount: 15580,
    chapters: chaptersFor("glass-orbit")
  },
  {
    slug: "velvet-signal",
    originalTitle: "Velvet Signal",
    titles: { en: "Velvet Signal", es: "Senal de Terciopelo" },
    descriptions: {
      en: "A late-night dispatcher receives coded requests from a hidden theater district.",
      es: "Una operadora nocturna recibe solicitudes cifradas de un distrito teatral oculto."
    },
    cover: {
      id: "cover-signal",
      src: "/placeholders/cover-signal.svg",
      alt: "Abstract cover for Velvet Signal",
      width: 640,
      height: 960
    },
    author: "June Kade",
    originalLanguage: "English",
    publicationStatus: "Ongoing",
    contentRating: "18+",
    tags: ["drama", "urban", "supernatural"],
    publishedAt: "2026-06-11",
    viewCount: 17140,
    chapters: chaptersFor("velvet-signal")
  },
  {
    slug: "aurora-floor",
    originalTitle: "Aurora Floor",
    titles: { en: "Aurora Floor", es: "Piso Aurora" },
    descriptions: {
      en: "A dance crew rehearses in an old hall where painted constellations point to new choices.",
      es: "Un grupo de baile ensaya en una sala antigua donde constelaciones pintadas senalan nuevas decisiones."
    },
    cover: {
      id: "cover-aurora",
      src: "/placeholders/cover-aurora.svg",
      alt: "Abstract cover for Aurora Floor",
      width: 640,
      height: 960
    },
    author: "Talia Moon",
    originalLanguage: "English",
    publicationStatus: "Completed",
    contentRating: "18+",
    tags: ["romance", "slice-of-life", "drama"],
    publishedAt: "2026-06-19",
    viewCount: 10490,
    chapters: chaptersFor("aurora-floor")
  },
  {
    slug: "ember-library",
    originalTitle: "Ember Library",
    titles: { en: "Ember Library", es: "Biblioteca Brasa" },
    descriptions: {
      en: "An apprentice cataloger protects warm-glowing books that rewrite their indexes overnight.",
      es: "Una aprendiz catalogadora protege libros luminosos que reescriben sus indices de noche."
    },
    cover: {
      id: "cover-ember",
      src: "/placeholders/cover-ember.svg",
      alt: "Abstract cover for Ember Library",
      width: 640,
      height: 960
    },
    author: "Cora Vale",
    originalLanguage: "English",
    publicationStatus: "Ongoing",
    contentRating: "18+",
    tags: ["fantasy", "comedy", "slice-of-life"],
    publishedAt: "2026-06-25",
    viewCount: 13220,
    chapters: chaptersFor("ember-library")
  },
  {
    slug: "quiet-arcade",
    originalTitle: "Quiet Arcade",
    titles: { en: "Quiet Arcade", es: "Arcade Silencioso" },
    descriptions: {
      en: "A repair technician restores retired arcade cabinets and finds messages hidden in attract screens.",
      es: "Una tecnica restaura maquinas arcade retiradas y encuentra mensajes ocultos en las pantallas."
    },
    cover: {
      id: "cover-arcade",
      src: "/placeholders/cover-arcade.svg",
      alt: "Abstract cover for Quiet Arcade",
      width: 640,
      height: 960
    },
    author: "Noel Park",
    originalLanguage: "English",
    publicationStatus: "Hiatus",
    contentRating: "18+",
    tags: ["urban", "comedy", "mystery"],
    publishedAt: "2026-07-03",
    viewCount: 8900,
    chapters: chaptersFor("quiet-arcade")
  },
  {
    slug: "opal-stair",
    originalTitle: "Opal Stair",
    titles: { en: "Opal Stair", es: "Escalera de Opalo" },
    descriptions: {
      en: "A city planner studies stairways that appear only during rain and connect distant neighborhoods.",
      es: "Una urbanista estudia escaleras que aparecen con la lluvia y conectan barrios distantes."
    },
    cover: {
      id: "cover-opal",
      src: "/placeholders/cover-opal.svg",
      alt: "Abstract cover for Opal Stair",
      width: 640,
      height: 960
    },
    author: "Ari West",
    originalLanguage: "English",
    publicationStatus: "Ongoing",
    contentRating: "18+",
    tags: ["fantasy", "romance", "supernatural"],
    publishedAt: "2026-07-12",
    viewCount: 19680,
    chapters: chaptersFor("opal-stair")
  }
];

export function findTitle(slug: string) {
  return demoTitles.find((title) => title.slug === slug);
}

export function findChapter(titleSlug: string, chapterSlug: string) {
  const title = findTitle(titleSlug);
  const chapter = title?.chapters.find((item) => item.slug === chapterSlug);
  return title && chapter ? { title, chapter } : null;
}

export function findTag(slug: string) {
  return demoTags.find((tag) => tag.slug === slug);
}

export function latestTitles() {
  return [...demoTitles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function popularTitles() {
  return [...demoTitles].sort((a, b) => b.viewCount - a.viewCount);
}
