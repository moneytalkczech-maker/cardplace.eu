import { useState } from "react";
import { ImageOff } from "lucide-react";

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
  category?: string;
}

export default function CardImage({ src, alt, className = "", category }: Props) {
  const [error, setError] = useState(false);

  // Placeholder emoji podle kategorie
  const placeholder = category === "pokemon" ? "🃏"
    : category === "sports" ? "🏀"
    : category === "magic" ? "✨"
    : category === "yugioh" ? "💀"
    : "🃏";

  if (!src || error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-[rgba(0,200,255,0.05)] to-[rgba(0,200,255,0.02)] ${className}`}>
        <span className="text-5xl opacity-20 select-none">{placeholder}</span>
        <p className="text-xs text-gray-600 mt-2 px-2 text-center">Obrázek zatím není dostupný</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}
