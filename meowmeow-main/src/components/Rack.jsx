import {useLayoutEffect, useRef, useState} from 'react';
import {mountTieRack} from '../motion/rack';
import {ProductMediaGallery} from '../shop/ProductMediaGallery';
import {TiePurchase} from '../shop/TiePurchase';
import {fmt, PRODUCTS} from '../shop/store';

function TieDetail({selection, onClose}) {
  const tie = PRODUCTS[selection.id];
  const close = useRef(null);
  useLayoutEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    close.current.focus();
    function escape(event) {
      if (event.key === 'Escape' && !document.querySelector('.tie-captcha[open], .bag-drawer[open], .product-media-lightbox[open]')) onClose();
    }
    window.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('keydown', escape);
      document.body.style.overflow = previousOverflow;
      selection.button.focus({preventScroll: true});
    };
  }, [onClose, selection]);

  return (
    <div id="pd" className="on" role="dialog" aria-modal="true" aria-labelledby="pdt">
      <button id="x" type="button" ref={close} onClick={onClose}>CLOSE ✕</button>
      <div className="pi"><ProductMediaGallery name={tie.name} media={tie.media} /></div>
      <div className="px">
        <small id="pdn">{tie.n}</small><h3 id="pdt">{tie.name}</h3>
        <p id="pd-spec">{tie.spec}</p><p id="pd-price">{tie.price === null ? 'Price pending' : fmt(tie.price)}</p>
        <TiePurchase id={selection.id} />
      </div>
    </div>
  );
}

export function Rack() {
  const section = useRef(null);
  const motion = useRef(null);
  const [selection, setSelection] = useState(null);
  const [active, setActive] = useState(null);
  useLayoutEffect(() => {
    motion.current = mountTieRack(section.current, setSelection, setActive);
    return () => motion.current.dispose();
  }, []);

  function closeDetail() {
    selection.onClose();
    setSelection(null);
  }

  return (
    <>
      <section id="rack" ref={section}>
        <h2 className="lab" data-reveal="split"><span>COLLECTION</span><span>THE RACK</span></h2>
        <div className="rw" id="rw">
          <div className="row" id="row">
            {['l', 'r'].map(side => <i className={`kn ${side}`} aria-hidden="true" key={side}><img src="/brand-assets/curva-monogram.svg" width="19" height="22" alt="" /></i>)}
            <canvas className="rack-shadow" aria-hidden="true" /><canvas className="rack-cloth" aria-hidden="true" />
            {Object.entries(PRODUCTS).map(([id, tie]) => (
              <div className="rack-item" data-id={id} key={id}>
                <i className="cloth-contact" aria-hidden="true" />
                <div className="tie-fallback" aria-hidden="true"><img src={tie.img} alt="" draggable="false" /></div>
                <button type="button" className="tie" aria-label={`${tie.n} ${tie.name}`}>
                  <span className="cap" aria-hidden="true"><b>{tie.name}</b>{tie.n} · View tie</span>
                </button>
              </div>
            ))}
          </div>
        </div>
        <button id="info" type="button" disabled={!active} onClick={() => motion.current.inspectActive()}>
          {active ? `VIEW ${active.toUpperCase()} →` : 'TAP A TIE TO INSPECT'}
        </button>
      </section>
      {selection && <TieDetail selection={selection} onClose={closeDetail} />}
    </>
  );
}
