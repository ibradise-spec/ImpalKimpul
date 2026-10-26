import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export default function Photo({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className="photo-fallback" role="img" aria-label={alt}>
        <ImageOff size={40} />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
