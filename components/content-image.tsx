type Props = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
};

export function ContentImage({ src, alt, className = "", fill = false, priority = false, sizes }: Props) {
  return (
    // Bunny serves the original asset directly so the active CDN hostname can change at runtime.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${fill ? "absolute inset-0 h-full w-full" : ""} ${className}`.trim()}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      sizes={sizes}
    />
  );
}
