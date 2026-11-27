import {useLayoutEffect, useMemo, useRef, useState} from 'react';
import {mountGallery} from '../motion/archive-gallery';
import {PRODUCTS} from '../shop/store';
import {ArchiveOverlay} from './ArchiveOverlay';

const formatNumber = number => String(number).padStart(2, '0');

export function ArchiveGallery({chapter, ...overlay}) {
  const viewport = useRef(null);
  const carousel = useRef(null);
  const [index, setIndex] = useState(0);
  const photos = useMemo(() => [chapter.feature, ...chapter.products.map(({id, photo}) => [...photo.slice(0, 3), PRODUCTS[id].name]), ...chapter.photos], [chapter]);

  useLayoutEffect(() => {
    carousel.current = mountGallery(viewport.current, photos, setIndex);
    return () => carousel.current.dispose();
  }, [photos]);

  function handleKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    switch (event.key) {
      case 'ArrowLeft': carousel.current.step(-1); break;
      case 'ArrowRight': carousel.current.step(1); break;
      case 'Home': carousel.current.jump(0); break;
      case 'End': carousel.current.jump(photos.length - 1); break;
      default: return;
    }
    event.preventDefault();
  }

  return (
    <ArchiveOverlay kind="gallery" titleId="archive-gallery-title" photo={chapter.feature} {...overlay}>
      <div className="archive-gallery-dialog" onKeyDown={handleKey}>
        <header className="archive-gallery-head" data-archive-enter="">
          <h2 id="archive-gallery-title">{chapter.title} <span>Gallery</span></h2>
          <button type="button" className="archive-close" data-archive-close="" onClick={overlay.onRequestClose}>Close <span aria-hidden="true">×</span></button>
        </header>
        <div className="archive-gallery-viewport" ref={viewport}>
          <div className="archive-gallery-target" data-archive-destination="" aria-hidden="true" />
          <div className="archive-gallery-prints" aria-hidden="true">
            {Array.from({length: 7}, (_, slot) => (
              <div className="archive-gallery-slot" key={slot}>
                <div className="archive-print" data-archive-print=""><img alt="" draggable="false" decoding="async" /><span>Photograph unavailable</span></div>
              </div>
            ))}
          </div>
        </div>
        <footer className="archive-gallery-foot" data-archive-enter="">
          <div className="archive-gallery-controls" role="group" aria-label="Photograph controls">
            <button type="button" aria-label="Previous photograph" onClick={() => carousel.current.step(-1)}>←</button>
            <button type="button" aria-label="Next photograph" onClick={() => carousel.current.step(1)}>→</button>
          </div>
          <p className="archive-gallery-counter" role="status">
            {formatNumber(index + 1)} <span aria-hidden="true">/</span><span className="sr"> of </span> {formatNumber(photos.length)}
            <span className="sr">. {photos[index][3]}</span>
          </p>
          <p className="archive-gallery-hint">Drag to explore</p>
        </footer>
      </div>
    </ArchiveOverlay>
  );
}
