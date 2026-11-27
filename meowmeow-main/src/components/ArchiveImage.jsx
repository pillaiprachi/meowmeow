import {useState} from 'react';

export function ArchiveImage({photo: [src, width, height, description], alt = description, sizes, eager, priority}) {
  const [missing, setMissing] = useState(false);
  return missing ? <span className="archive-image-error" role="img" aria-label={alt || 'Photograph unavailable'}>Photograph unavailable</span> : (
    <img src={src} width={width} height={height} alt={alt} decoding="async" draggable="false"
      srcSet={sizes ? `${src.replace('.webp', '-640.webp')} 640w, ${src} ${width}w` : undefined} sizes={sizes}
      loading={eager || priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined}
      onError={() => setMissing(true)} />
  );
}
