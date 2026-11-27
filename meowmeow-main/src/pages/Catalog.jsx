import {Fragment, useLayoutEffect, useRef, useState} from 'react';
import {ArchiveGallery} from '../components/ArchiveGallery';
import {ArchiveImage} from '../components/ArchiveImage';
import {ArchiveOverlay} from '../components/ArchiveOverlay';
import {mountArchive} from '../motion/archive';
import {ProductMediaGallery} from '../shop/ProductMediaGallery';
import {TiePurchase} from '../shop/TiePurchase';
import {fmt, PRODUCTS} from '../shop/store';
import {catalogChapters} from './catalog-chapters';

const priceText = tie => tie.price === null ? 'Price pending' : fmt(tie.price);
const catalogProducts = new Map(catalogChapters.flatMap(({products}) => products.map(product => [product.id, product])));

function CatalogProduct({product: {id, legacyAnchor, photo}, first, onSelect}) {
  const tie = PRODUCTS[id];
  return (
    <li className="archive-product" id={legacyAnchor}>
      <div className="archive-card-motion">
        <a className="archive-card" href={`/curva?tie=${encodeURIComponent(id)}#rack`} id={id} onClick={event => onSelect(event, id)}>
          <div className="archive-card-photo">
            <div className="archive-image-mask" data-reveal="right">
              <div className="archive-image-inner">
                <ArchiveImage photo={photo} eager={first} sizes="(max-width: 760px) 47vw, (max-width: 1100px) 30vw, 23vw" />
              </div>
            </div>
          </div>
          <div className="archive-card-caption">
            <div>
              <h3>{tie.name}</h3>
              <p>{priceText(tie)}</p>
            </div>
            <span className="archive-card-arrow" aria-hidden="true">↗</span>
          </div>
        </a>
      </div>
    </li>
  );
}

function CatalogChapter({chapter, index, onGallery, onSelect}) {
  const {id, title, feature, products, photos} = chapter;
  const first = index === 0;

  return (
    <section className={`archive-chapter archive-chapter--${index % 3 + 1}`} id={id} aria-labelledby={`${id}-title`}>
      <header className="archive-chapter-head">
        <h2 className="archive-chapter-title" id={`${id}-title`}><span>{title}</span></h2>
        <div className="archive-chapter-tools">
          <button type="button" className="archive-gallery-trigger" onClick={event => onGallery(event, chapter)} aria-haspopup="dialog">
            <span>View chapter gallery <small>{photos.length + products.length + 1} photographs</small></span>
            <span className="archive-gallery-icon" aria-hidden="true">↗</span>
          </button>
        </div>
      </header>
      <div className="archive-spread">
        <figure className="archive-hero">
          <div className="archive-image-mask" data-reveal="up">
            <div className="archive-image-inner">
              <div className="archive-hero-parallax">
                <ArchiveImage photo={feature} priority={first} sizes="(max-width: 760px) 92vw, (max-width: 1100px) 70vw, 61vw" />
              </div>
            </div>
          </div>
        </figure>
        <ul className="archive-products">
          {products.map(product => <CatalogProduct key={product.id} product={product} first={first} onSelect={onSelect} />)}
        </ul>
      </div>
    </section>
  );
}

function ChapterMorph({from, to, index}) {
  return (
    <div className="archive-runway" data-direction={index % 2 === 0 ? 'left' : 'right'} aria-hidden="true">
      <div className="archive-morph-stage">
        <div className="archive-morph-paper" />
        <div className="archive-morph-window">
          {[from.feature, to.feature].map(([src, width, height]) => (
            <div className="archive-morph-layer" key={src}>
              <img data-src={src} width={width} height={height} alt="" decoding="async" draggable="false" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArchiveProductDetail({id, ...overlay}) {
  const tie = PRODUCTS[id];
  const {photo} = catalogProducts.get(id);
  return (
    <ArchiveOverlay kind="product" titleId="archive-product-title" photo={photo} {...overlay}>
      <div className="archive-detail">
        <button type="button" className="archive-close" data-archive-close="" onClick={overlay.onRequestClose}>Back to catalog <span aria-hidden="true">×</span></button>
        <div className="archive-detail-photo">
          <ProductMediaGallery name={tie.name} media={tie.media} flight />
        </div>
        <div className="archive-detail-copy">
          <div data-archive-enter="">
            <p className="archive-label">{tie.n}</p>
            <h2 id="archive-product-title">{tie.name}</h2>
            <p className="archive-detail-price">{priceText(tie)}</p>
          </div>
          <div className="archive-detail-spec" data-archive-enter="">
            <img src={tie.img} alt={`${tie.name}, product view`} width="72" height="98" />
            <p>{tie.spec}</p>
          </div>
          <div className="archive-detail-purchase" data-archive-enter=""><TiePurchase id={id} /></div>
        </div>
      </div>
    </ArchiveOverlay>
  );
}

function capture(trigger, source) {
  return {trigger, source, origin: source?.getBoundingClientRect(), scroll: window.scrollY};
}

export function Catalog() {
  const catalog = useRef(null);
  const progress = useRef(null);
  const active = useRef(null);
  const sequence = useRef(0);
  const [overlay, setOverlay] = useState(null);

  function update(value) {
    active.current = value;
    setOverlay(value);
  }

  useLayoutEffect(() => mountArchive(catalog.current, progress.current), []);
  useLayoutEffect(() => {
    const controller = new AbortController();
    window.addEventListener('popstate', event => {
      const id = event.state?.archiveTie;
      if (catalogProducts.has(id)) {
        const trigger = document.getElementById(id);
        update({kind: 'product', id, key: ++sequence.current, ...capture(trigger, trigger?.querySelector('.archive-card-photo'))});
      } else if (active.current) {
        update({...active.current, closing: true});
      }
    }, {signal: controller.signal});
    return () => controller.abort();
  }, []);

  function openGallery(event, chapter) {
    if (active.current) return;
    const trigger = event.currentTarget;
    const source = trigger.closest('.archive-chapter').querySelector('.archive-hero');
    update({kind: 'gallery', chapter, key: ++sequence.current, ...capture(trigger, source)});
  }

  function openProduct(event, id) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (active.current) {
      event.preventDefault();
      return;
    }
    const trigger = event.currentTarget;
    try {
      history.pushState({archiveTie: id}, '', trigger.href);
    } catch {
      return;
    }
    event.preventDefault();
    update({kind: 'product', id, key: ++sequence.current, ...capture(trigger, trigger.querySelector('.archive-card-photo'))});
  }

  function close() {
    const current = active.current;
    if (!current || current.closing || current.returning) return;
    if (current.kind === 'product' && history.state?.archiveTie === current.id) {
      active.current = {...current, returning: true};
      history.back();
    } else {
      update({...current, closing: true});
    }
  }

  const dialogProps = overlay ? {
    source: overlay.source, trigger: overlay.trigger, origin: overlay.origin, scroll: overlay.scroll, closing: overlay.closing,
    onRequestClose: close, onClosed: () => { if (active.current?.key === overlay.key) update(null); },
  } : null;

  return (
    <>
      <div className="archive-progress" aria-hidden="true" ref={progress} />
      <main className="archive" ref={catalog}>
        <header className="archive-mast" id="campaign-gallery">
          <p className="archive-label">CURVA <span>/</span> Catalog</p>
          <div className="archive-mast-row">
            <h1>The Living <em>Archive</em></h1>
            <nav className="archive-index" aria-label="Catalog chapters">
              {catalogChapters.map(({id, title}) => <a href={`#${id}`} key={id}>{title}</a>)}
            </nav>
          </div>
        </header>
        {catalogChapters.map((chapter, index) => (
          <Fragment key={chapter.id}>
            {index > 0 && <ChapterMorph from={catalogChapters[index - 1]} to={chapter} index={index} />}
            <CatalogChapter chapter={chapter} index={index} onGallery={openGallery} onSelect={openProduct} />
          </Fragment>
        ))}
        <nav className="archive-end archive-label" aria-label="Catalog links">
          <a href="/curva#rack">Visit the rack <span aria-hidden="true">↗</span></a>
          <a href="#top">Back to top <span aria-hidden="true">↑</span></a>
        </nav>
      </main>
      {overlay?.kind === 'gallery' && <ArchiveGallery chapter={overlay.chapter} {...dialogProps} key={overlay.key} />}
      {overlay?.kind === 'product' && <ArchiveProductDetail id={overlay.id} {...dialogProps} key={overlay.key} />}
    </>
  );
}
