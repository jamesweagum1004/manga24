import { db, queryClient } from "../db";
import {
  admins,
  assets,
  chapterLocalizations,
  chapterPages,
  chapters,
  tags,
  titleLocalizations,
  titles,
  titleTags
} from "../db/schema";

const titleSeeds = [
  {
    slug: "midnight-atelier",
    originalTitle: "Midnight Atelier",
    authorName: "Studio Mira",
    originalLanguage: "en",
    cover: "/placeholders/cover-atelier.svg",
    localizations: {
      en: {
        title: "Midnight Atelier",
        slug: "midnight-atelier",
        description: "A quiet painter discovers a hidden studio where unfinished memories become luminous panels."
      },
      es: {
        title: "Atelier de Medianoche",
        slug: "atelier-de-medianoche",
        description: "Una pintora descubre un taller oculto donde los recuerdos inconclusos se vuelven paneles luminosos."
      }
    },
    tags: ["romance", "drama", "slice-of-life"],
    publishedAt: "2026-01-14T00:00:00.000Z",
    viewCount: 12400
  },
  {
    slug: "neon-shelter",
    originalTitle: "Neon Shelter",
    authorName: "Arden Vale",
    originalLanguage: "en",
    cover: "/placeholders/cover-neon.svg",
    localizations: {
      en: {
        title: "Neon Shelter",
        slug: "neon-shelter",
        description: "Two night-shift neighbors build trust while protecting a rooftop garden in a rain-soaked city."
      },
      es: {
        title: "Refugio de Neón",
        slug: "refugio-de-neon",
        description: "Dos vecinos de turno nocturno construyen confianza mientras protegen un jardín sobre la ciudad."
      }
    },
    tags: ["drama", "urban", "romance"],
    publishedAt: "2026-02-21T00:00:00.000Z",
    viewCount: 18420
  },
  {
    slug: "paper-moon-cafe",
    originalTitle: "Paper Moon Cafe",
    authorName: "Lena Coast",
    originalLanguage: "en",
    cover: "/placeholders/cover-cafe.svg",
    localizations: {
      en: {
        title: "Paper Moon Cafe",
        slug: "paper-moon-cafe",
        description: "A reserved baker and a touring musician trade letters, recipes, and second chances."
      },
      es: {
        title: "Café Luna de Papel",
        slug: "cafe-luna-de-papel",
        description: "Una repostera reservada y un músico de gira intercambian cartas, recetas y segundas oportunidades."
      }
    },
    tags: ["slice-of-life", "comedy", "romance"],
    publishedAt: "2026-03-08T00:00:00.000Z",
    viewCount: 9630
  }
] as const;

const tagSeeds = [
  { slug: "romance", nameEn: "Romance", nameEs: "Romance" },
  { slug: "drama", nameEn: "Drama", nameEs: "Drama" },
  { slug: "slice-of-life", nameEn: "Slice of Life", nameEs: "Vida cotidiana" },
  { slug: "comedy", nameEn: "Comedy", nameEs: "Comedia" },
  { slug: "urban", nameEn: "Urban", nameEs: "Urbano" }
] as const;

async function main() {
  await db.insert(admins).values({
    email: "admin@example.test",
    displayName: "Demo Admin",
    passwordHash: "replace-with-a-real-hash-before-production"
  });

  const insertedTags = await db.insert(tags).values([...tagSeeds]).returning();
  const tagsBySlug = new Map(insertedTags.map((tag) => [tag.slug, tag]));

  for (const [titleIndex, titleSeed] of titleSeeds.entries()) {
    const [coverAsset] = await db
      .insert(assets)
      .values({
        kind: "cover",
        objectKey: titleSeed.cover,
        publicUrl: titleSeed.cover,
        width: 640,
        height: 960,
        altText: `${titleSeed.originalTitle} cover placeholder`
      })
      .returning();

    const [title] = await db
      .insert(titles)
      .values({
        slug: titleSeed.slug,
        originalTitle: titleSeed.originalTitle,
        originalLanguage: titleSeed.originalLanguage,
        authorName: titleSeed.authorName,
        publicationStatus: "ongoing",
        contentRating: "mature_18",
        coverAssetId: coverAsset.id,
        publishedAt: new Date(titleSeed.publishedAt),
        viewCount: titleSeed.viewCount
      })
      .returning();

    await db.insert(titleLocalizations).values([
      { titleId: title.id, locale: "en", ...titleSeed.localizations.en },
      { titleId: title.id, locale: "es", ...titleSeed.localizations.es }
    ]);

    await db.insert(titleTags).values(
      titleSeed.tags.map((slug) => ({
        titleId: title.id,
        tagId: tagsBySlug.get(slug)!.id
      }))
    );

    for (let chapterIndex = 1; chapterIndex <= 3; chapterIndex += 1) {
      const [chapter] = await db
        .insert(chapters)
        .values({
          titleId: title.id,
          chapterNumber: String(chapterIndex),
          slug: `chapter-${chapterIndex}`,
          publicationStatus: "published",
          publishedAt: new Date(Date.UTC(2026, titleIndex + 1, chapterIndex * 5))
        })
        .returning();

      await db.insert(chapterLocalizations).values([
        { chapterId: chapter.id, locale: "en", title: `Chapter ${chapterIndex}` },
        { chapterId: chapter.id, locale: "es", title: `Capítulo ${chapterIndex}` }
      ]);

      for (let pageIndex = 1; pageIndex <= 6; pageIndex += 1) {
        const path = `/placeholders/reader-${((pageIndex - 1) % 6) + 1}.svg`;
        const [pageAsset] = await db
          .insert(assets)
          .values({
            kind: "chapter_page",
            objectKey: path,
            publicUrl: path,
            width: 820,
            height: 1280,
            altText: `${titleSeed.originalTitle} chapter ${chapterIndex} placeholder page ${pageIndex}`
          })
          .returning();

        await db.insert(chapterPages).values({
          chapterId: chapter.id,
          assetId: pageAsset.id,
          pageNumber: pageIndex
        });
      }
    }
  }

  await queryClient.end({ timeout: 1 });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
