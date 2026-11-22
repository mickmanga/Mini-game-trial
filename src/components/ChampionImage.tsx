import {useState} from 'react';
import {Bug} from 'lucide-react';

interface ChampionImageProps {
  src: string;
  alt: string;
  title: string;
  accentHex: string;
  className?: string;
  draggable?: boolean;
}

export function ChampionImage({
  src,
  alt,
  title,
  accentHex,
  className = '',
  draggable = false,
}: ChampionImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden bg-[#12141B] text-center select-none ${className}`}
        style={{
          backgroundImage: `radial-gradient(circle at 50% 35%, ${accentHex}24, transparent 70%)`,
        }}
      >
        <Bug className="h-8 w-8 text-[#9DA3B0]" aria-hidden="true" />
        <span className="mt-2 px-4 text-xs font-medium text-[#D6D3CB]">
          {title}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#12141B] ${className}`}>
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-[#151821]"
          aria-hidden="true"
        />
      )}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        draggable={draggable}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`h-full w-full object-cover transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
