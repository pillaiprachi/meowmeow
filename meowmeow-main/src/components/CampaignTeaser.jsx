import { useLayoutEffect, useRef, useState } from 'react';
import { mountCampaign } from '../motion/campaign';
import { catalogChapters } from '../pages/catalog-chapters';

export function CampaignTeaser() {
  const section = useRef(null);
  const rail = useRef(null);
  const [scroll, setScroll] = useState({ max: 0, left: 0, width: 0, content: 1 });
  useLayoutEffect(() => mountCampaign(section.current, { revealOutside: true }), []);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(updateRail);
    observer.observe(rail.current);
    updateRail();
    return () => observer.disconnect();
  }, []);

  function updateRail() {
    const { clientWidth: width, scrollWidth: content, scrollLeft } = rail.current;
    const max = content - width;
    setScroll({ max, left: Math.max(0, Math.min(max, scrollLeft)), width, content: content || 1 });
  }

  function moveRail(direction) {
    const node = rail.current;
    const stops = [...node.children].map((card) =>
      Math.min(scroll.max, card.offsetLeft - node.firstElementChild.offsetLeft),
    );
    const left =
      direction > 0 ? stops.find((stop) => stop > scroll.left + 1) : stops.findLast((stop) => stop < scroll.left - 1);
    if (left !== undefined) {
      node.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }

  return (
    <section ref={section} id="camp" className="campaign-shell" aria-labelledby="campaign-title" data-campaign="">
      <div className="campaign-teaser">
        <div className="campaign-teaser-copy">
          <p className="campaign-label campaign-label--muted" data-reveal="">
            Curva campaign
          </p>
          <h2 className="campaign-title" id="campaign-title" data-reveal="title">
            <span className="campaign-title-line">
              <span>Silk in</span>
            </span>
            <span className="campaign-title-line">
              <span>Motion</span>
            </span>
          </h2>
          <p className="campaign-teaser-description" data-reveal="">
            Four silk ties inspired by the culture of football.
          </p>
          <a className="campaign-link campaign-label" href="/catalog">
            View the catalog
          </a>
        </div>
        <div className="campaign-teaser-images">
          <figure className="campaign-plate" data-reveal="">
            <div className="campaign-frame">
              <img
                src="/campaign-assets/plate-14.webp"
                width="1000"
                height="1500"
                alt="Model wearing Il Controllo with a black jacket and white shirt"
                decoding="async"
                loading="lazy"
              />
            </div>
            <figcaption>Il Controllo</figcaption>
          </figure>
          <figure className="campaign-plate" data-reveal="">
            <div className="campaign-frame">
              <img
                src="/campaign-assets/plate-22.webp"
                width="1000"
                height="1500"
                alt="Model wearing the orange La Battuta tie with a blue jacket"
                decoding="async"
                loading="lazy"
              />
            </div>
            <figcaption>La Battuta</figcaption>
          </figure>
        </div>
      </div>
      <figure className="campaign-plate campaign-feature" data-reveal="">
        <div className="campaign-frame campaign-feature-media">
          <img
            src="/campaign-assets/plate-02.webp"
            width="1500"
            height="1000"
            alt="Close-up of the red Il Ritmo tie against a black football jersey"
            decoding="async"
            loading="lazy"
          />
        </div>
        <figcaption className="campaign-feature-caption">
          <p className="campaign-feature-title">Il Ritmo</p>
          <a className="campaign-link campaign-label" href="/catalog#il-ritmo">
            Explore Il Ritmo
          </a>
        </figcaption>
      </figure>
      <div className="campaign-chapter-preview">
        <div className="campaign-preview-heading">
          <h3 className="campaign-preview-title" data-reveal="title">
            <span className="campaign-title-line">
              <span>The chapters</span>
            </span>
          </h3>
          <a className="campaign-link campaign-label" href="/catalog#campaign-gallery">
            View all chapters
          </a>
        </div>
        <div
          className="campaign-rail"
          id="campaign-chapter-rail"
          role="group"
          aria-label="Campaign chapters"
          ref={rail}
          onScroll={updateRail}
        >
          {catalogChapters.map(({id, title, products: [{photo: [src, width, height]}]}) => (
            <a className="campaign-card" href={`/catalog#${id}`} key={id} data-reveal="">
              <div className="campaign-frame">
                <img src={src} width={width} height={height} alt="" decoding="async" loading="lazy" />
              </div>
              <span className="campaign-card-label">{title}</span>
            </a>
          ))}
        </div>
        <div
          className="campaign-rail-controls"
          hidden={scroll.max <= 1}
          style={{
            '--rail-thumb-width': `${(scroll.width / scroll.content) * 100}%`,
            '--rail-thumb-offset': `${(scroll.left / scroll.content) * 100}%`,
          }}
        >
          <button
            className="campaign-label"
            type="button"
            data-rail-direction="-1"
            aria-controls="campaign-chapter-rail"
            aria-disabled={scroll.left <= 1}
            onClick={() => moveRail(-1)}
          >
            Previous
          </button>
          <div className="campaign-rail-progress" aria-hidden="true">
            <span></span>
          </div>
          <button
            className="campaign-label"
            type="button"
            data-rail-direction="1"
            aria-controls="campaign-chapter-rail"
            aria-disabled={scroll.left >= scroll.max - 1}
            onClick={() => moveRail(1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
