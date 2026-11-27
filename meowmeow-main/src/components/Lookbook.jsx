import { useLayoutEffect, useRef, useState } from 'react';
import { mountLookbook } from '../motion/lookbook';

export function Lookbook() {
  const section = useRef(null);
  const motion = useRef(null);
  const [spread, setSpread] = useState(null);
  useLayoutEffect(() => {
    motion.current = mountLookbook(section.current, setSpread);
    return () => motion.current.dispose();
  }, []);

  return (
    <section ref={section} id="lookbook" aria-labelledby="lookbook-title">
      <div className="lookbook-shell">
        <header className="lookbook-header">
          <h2 id="lookbook-title">Lookbook</h2>
          <p>Silk in Motion</p>
        </header>
        <div className="lookbook-reader" role="group" aria-label="CURVA lookbook" tabIndex="0">
          <div className="lookbook-viewport" id="lookbook-pages">
            <article className="lookbook-page" aria-label="Page 1, cover">
              <img
                className="lookbook-image"
                src="/lookbook-assets/page-01.webp"
                width="1400"
                height="1980"
                alt="CURVA. Sport culture, worn in silk. A model wears the red Il Ritmo tie with a black shirt."
                draggable="false"
                loading="lazy"
                decoding="async"
              />
            </article>
            <article className="lookbook-page" aria-label="Page 2, introduction">
              <img
                className="lookbook-image"
                src="/lookbook-assets/page-02.webp"
                width="1400"
                height="1980"
                alt="A seated model wears the red Il Ritmo tie against a black shirt."
                draggable="false"
                loading="lazy"
                decoding="async"
              />
              <p className="lookbook-page-text">
                CURVA is a different perspective on sporting culture. Iconic moments, quiet references and a lasting
                place in the modern wardrobe.
              </p>
            </article>
            <article className="lookbook-page" aria-label="Page 3, Il Controllo">
              <img
                className="lookbook-image"
                src="/lookbook-assets/page-03.webp"
                width="1400"
                height="1980"
                alt="The black Il Controllo tie with a football print, styled with a tan jacket, white shirt and jeans."
                draggable="false"
                loading="lazy"
                decoding="async"
              />
            </article>
            <article className="lookbook-page" aria-label="Page 4, La Corsa portrait">
              <img
                className="lookbook-image"
                src="/lookbook-assets/page-04.webp"
                width="1400"
                height="1980"
                alt="A model in sunglasses wears the green La Corsa tie and a dark suit outdoors."
                draggable="false"
                loading="lazy"
                decoding="async"
              />
            </article>
            <article className="lookbook-page" aria-label="Page 5, La Corsa editorial">
              <img
                className="lookbook-image"
                src="/lookbook-assets/page-05.webp"
                width="1400"
                height="1980"
                alt="A model in a cap and navy jacket wears La Corsa while seated on a park bench."
                draggable="false"
                loading="lazy"
                decoding="async"
              />
              <p className="lookbook-page-text">
                From the stands to the streets. A new perspective on a timeless menswear essential.
              </p>
            </article>
            <article className="lookbook-page" aria-label="Page 6, tie collection, left side">
              <img
                className="lookbook-image"
                src="/lookbook-assets/page-06.webp"
                width="1400"
                height="1980"
                alt="La Corsa laid flat, with the left half of the L’Istante image at the fold."
                draggable="false"
                loading="lazy"
                decoding="async"
              />
              <div className="lookbook-page-text">
                <p>
                  Nº02 — La Corsa | R9. Explosive pace, raw instinct and a kind of brilliance that made the impossible
                  look effortless.
                </p>
                <p>
                  Nº01 — L’Istante | Maradona. A moment of pure imagination. Defiance, genius and the beautiful
                  unpredictability of football.
                </p>
              </div>
            </article>
            <article className="lookbook-page" aria-label="Page 7, tie collection, right side">
              <img
                className="lookbook-image"
                src="/lookbook-assets/page-07.webp"
                width="1400"
                height="1980"
                alt="The continuation of L’Istante at the fold, next to the red Il Ritmo tie laid flat."
                draggable="false"
                loading="lazy"
                decoding="async"
              />
              <p className="lookbook-page-text">
                Nº04 — Il Ritmo | R10. Rhythm, joy and effortless flair. Football played with freedom, as much an art as
                a game.
              </p>
            </article>
            <article className="lookbook-page" aria-label="Page 8, craftsmanship">
              <img
                className="lookbook-image"
                src="/lookbook-assets/page-08.webp"
                width="1400"
                height="1980"
                alt="A close-up of a brown jacket and white shirt."
                draggable="false"
                loading="lazy"
                decoding="async"
              />
              <div className="lookbook-page-text">
                <p>
                  Crafted from 100% silk twill in a substantial 16 momme weight, each tie features a traditional
                  three-fold construction, self-tipped ends and a matching silk keeper loop.
                </p>
                <p>
                  Measuring 150 cm in length, with a 7 cm blade and 3.5 cm tail, each piece is finished with an all-over
                  digital print, a custom woven label and signature packaging.
                </p>
              </div>
            </article>
            <article className="lookbook-page" aria-label="Page 9, closing portrait">
              <img
                className="lookbook-image"
                src="/lookbook-assets/page-09.webp"
                width="1400"
                height="1980"
                alt="A close-up of a magenta tie with a white shirt and brown jacket."
                draggable="false"
                loading="lazy"
                decoding="async"
              />
            </article>
          </div>
        </div>
        <div className="lookbook-controls" hidden={!spread}>
          <button
            type="button"
            data-turn="-1"
            aria-controls="lookbook-pages"
            aria-disabled={!spread?.previous}
            onClick={() => motion.current.turnBy(-1)}
          >
            Previous
          </button>
          <p className="lookbook-count" aria-live="polite" aria-atomic="true">
            {spread?.label}
          </p>
          <button
            type="button"
            data-turn="1"
            aria-controls="lookbook-pages"
            aria-disabled={!spread?.next}
            onClick={() => motion.current.turnBy(1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
