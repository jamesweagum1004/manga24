import type { AdKind, AdPosition } from "@/lib/db/queries/ads";

type Ad = {
  id: string;
  name: string;
  kind: AdKind;
  position: AdPosition;
  imageUrl: string | null;
  clickUrl: string | null;
  altText: string | null;
  embedCode: string | null;
  width: number;
  height: number;
};

export function AdStrip({ ads, label = "Advertisement" }: { ads: Ad[]; label?: string }) {
  if (ads.length === 0) return null;

  return (
    <aside aria-label={label} className="mx-auto grid w-full max-w-[1480px] grid-cols-1 gap-2 px-2 py-2 sm:grid-cols-2 sm:px-3 lg:grid-cols-3 lg:gap-3 lg:px-0 lg:py-3">
      {ads.map((ad) => <AdUnit key={ad.id} ad={ad} />)}
    </aside>
  );
}

function AdUnit({ ad }: { ad: Ad }) {
  if (ad.kind === "exoclick" && ad.embedCode) {
    return (
      <iframe
        title={ad.name}
        srcDoc={ad.embedCode}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
        scrolling="no"
        style={{ width: "100%", height: `${ad.height}px`, border: 0, overflow: "hidden" }}
        className="block rounded-md bg-transparent"
      />
    );
  }

  if (!ad.imageUrl) return null;
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ad.imageUrl}
      alt={ad.altText ?? ad.name}
      width={ad.width}
      height={ad.height}
      loading="lazy"
      className="mx-auto block h-auto max-h-40 w-full rounded-md object-contain"
    />
  );

  return ad.clickUrl ? (
    <a href={ad.clickUrl} target="_blank" rel="sponsored noopener noreferrer" aria-label={ad.altText ?? ad.name}>
      {image}
    </a>
  ) : image;
}
