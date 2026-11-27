import {createContext, useCallback, useContext, useRef, useSyncExternalStore} from 'react';
import {bag, bagCount, bagSubtotal, fmt, lineTotal, MAX_QTY, PRODUCTS} from './store';

const OpenBag = createContext(null);
export const useOpenBag = () => useContext(OpenBag);
export const useBag = () => useSyncExternalStore(bag.subscribe, bag.snapshot);

export function BagProvider({checkout, children}) {
  const dialog = useRef(null);
  const open = useCallback(() => {
    if (checkout) {
      document.getElementById('checkout')?.scrollIntoView();
    } else if (dialog.current && !dialog.current.open) {
      dialog.current.showModal();
      document.documentElement.classList.add('bag-lock');
    }
  }, [checkout]);

  return (
    <OpenBag.Provider value={open}>
      {children}
      {!checkout && <BagDrawer dialog={dialog} />}
    </OpenBag.Provider>
  );
}

function BagDrawer({dialog}) {
  const lines = useBag();
  const count = bagCount(lines);
  const subtotal = bagSubtotal(lines);
  const closeButton = useRef(null);
  const close = () => dialog.current.close();

  return (
    <dialog className="bag-drawer" aria-labelledby="bag-title" ref={dialog}
      onClick={event => { if (event.target === event.currentTarget) close(); }}
      onClose={() => document.documentElement.classList.remove('bag-lock')}>
      <div className="bag-inner">
        <header className="bag-head">
          <h2 id="bag-title">Bag <span className="bag-count">({count})</span></h2>
          <button className="bag-close" ref={closeButton} type="button" onClick={close}>Close <span aria-hidden="true">✕</span></button>
        </header>
        <p className="bag-empty" hidden={count > 0}>Your bag is empty.</p>
        <ul className="bag-lines" role="list">
          {lines.map(({id, qty}) => (
            <BagLine key={id} id={id} qty={qty} focusClose={() => closeButton.current.focus()} />
          ))}
        </ul>
        <footer className="bag-foot" hidden={count === 0}>
          <div className="bag-row"><span>Subtotal</span><span className="bag-subtotal">{fmt(subtotal)}</span></div>
          <p className="bag-fine">{subtotal === null ? 'Your subtotal is pending product pricing.' : 'French VAT (20%) included. Shipping is calculated at checkout.'}</p>
          <a className="btn btn--solid bag-checkout" href="/checkout">Checkout</a>
        </footer>
      </div>
    </dialog>
  );
}

function BagLine({id, qty, focusClose}) {
  const item = PRODUCTS[id];
  function change(next) {
    if (next < 1 || next === MAX_QTY) focusClose();
    bag.set(id, next);
  }
  return (
    <li className="bag-line" data-id={id}>
      <img src={item.img} alt="" width="72" height="96" loading="lazy" />
      <div className="bag-line-body">
        <p className="bag-line-name"><span>{item.n}</span> {item.name}</p>
        <p className="bag-line-spec">{item.spec}</p>
        <div className="qty" role="group" aria-label={`Quantity of ${item.name}`}>
          <button type="button" data-act="dec" aria-label={`Remove one ${item.name}`} onClick={() => change(qty - 1)}>−</button>
          <output aria-live="polite">{qty}</output>
          <button type="button" data-act="inc" aria-label={`Add one ${item.name}`} disabled={qty >= MAX_QTY} onClick={() => change(qty + 1)}>+</button>
        </div>
      </div>
      <div className="bag-line-end">
        <p>{item.price === null ? 'Price pending' : fmt(lineTotal(item, qty))}</p>
        <button type="button" className="link" data-act="remove" onClick={() => change(0)}>Remove<span className="sr"> {item.name}</span></button>
      </div>
    </li>
  );
}
