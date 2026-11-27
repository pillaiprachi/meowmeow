import {useEffect, useMemo, useRef, useState} from 'react';
import {PRODUCTS} from '../shop/store';
import {mountHelix} from '../motion/helix';

// Each tie appears three times so the spiral reads as two full turns.
const COPIES = 3;

// The six cutouts, in the same order as the rack and PRODUCTS.

const TIE_IMAGES = [
  '/helix-assets/navy.webp',
  '/helix-assets/red.webp',
  '/helix-assets/black.webp',
  '/helix-assets/red.webp',
  '/helix-assets/orange.webp',
  '/helix-assets/pink.webp'
];

export function TieHelix({onInspect}) {
  const section = useRef(null);
  const controls = useRef(null);
  const inspect = useRef(onInspect);
  inspect.current = onInspect;
  const ties = useMemo(() => Object.entries(PRODUCTS)
    .slice(0, TIE_IMAGES.length)
    .map(([id, product], index) => ({
      id,
      name: product.name,
      image: TIE_IMAGES[index],
      // No close-up photos yet, so the floating images are crops of the tie's knot and tip.
      details: []
    })), []);
  const [current, setCurrent] = useState(null);

  function open(index, button) {
    const tie = ties[index];
    if (inspect.current) {
      inspect.current({id: tie.id, button, onClose() {}});
      return;
    }
    // Reuse the rack's product detail on the same page instead of reloading.
    const rackTie = document.querySelector(`.rack-item[data-id="${CSS.escape(tie.id)}"] .tie`);
    if (rackTie) rackTie.click();
    else location.assign(`/?tie=${encodeURIComponent(tie.id)}#rack`);
  }

  useEffect(() => {
    controls.current = mountHelix(section.current, {
      ties,
      onSettle: setCurrent,
      onMove: () => setCurrent(null),
      onInspect: open
    });
    return () => controls.current.dispose();
  }, [ties]);

  const slots = Array.from({length: ties.length * COPIES}, (_, slot) => ties[slot % ties.length]);
  const tie = current == null ? null : ties[current];

  return (
    <section id="helix" className="hx" ref={section} aria-labelledby="helix-title">
      <header className="hx-head">
        <h2 id="helix-title">THE SPIRAL</h2>
        <span>DRAG, OR USE ← →</span>
      </header>
      <div className="hx-stage" tabIndex={0} role="group" aria-roledescription="carousel"
        aria-label="Ties. Use the left and right arrow keys to turn, Enter to open.">
        <div className="hx-ring">
          {slots.map((item, slot) => {
            const primary = slot < ties.length;
            return (
              <button key={slot} type="button" className="hx-tie" tabIndex={-1}
                aria-hidden={primary ? undefined : true} aria-label={primary ? item.name : undefined}>
                <img src={item.image} alt="" draggable="false" />
              </button>
            );
          })}
        </div>
        <div className="hx-float" aria-hidden="true" />
        <div className="hx-float" aria-hidden="true" />
        <div className="hx-caption">
          <b>{tie?.name}</b>
          <button type="button" className="cta" tabIndex={tie ? 0 : -1}
            onClick={event => open(current, event.currentTarget)}>VIEW THE TIE</button>
        </div>
      </div>
      <nav className="hx-nav" aria-label="Spiral controls">
        <button type="button" onClick={() => controls.current?.shift(-1)}>← PREVIOUS</button>
        <button type="button" onClick={() => controls.current?.shift(1)}>NEXT →</button>
      </nav>
      <p className="hx-sr" aria-live="polite">{tie ? `${tie.name}, ${current + 1} of ${ties.length}` : ''}</p>
    </section>
  );
}