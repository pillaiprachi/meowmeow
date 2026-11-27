import {galleryMedia} from './product-media.js';

export const SHOP = { domain: 'curva.world', checkoutEnabled: false };

// Prices in euro cents, including French VAT (20%).
const products = {
  'l-istante': {n: 'Nº01', name: 'L’Istante', price: 5900, img: '/rack-assets/maradona-cutout.webp', imageWidth: 310, spec: '100% silk · 16mm twill', variantId: null},
  'la-corsa': {n: 'Nº02', name: 'La Corsa', price: 5900, img: '/rack-assets/r9-cutout.webp', imageWidth: 284, spec: '100% silk · 16mm twill', variantId: null},
  'il-controllo': {n: 'Nº03', name: 'Il Controllo', price: 5900, img: '/lookbook-assets/il-controllo.webp', imageWidth: 310, spec: '100% silk · 16mm twill', variantId: null},
  'il-ritmo': {n: 'Nº04', name: 'Il Ritmo', price: 5900, img: '/lookbook-assets/il-ritmo.webp', imageWidth: 306, spec: '100% silk · 16mm twill', variantId: null},
  'nadal-orange': {n: 'Nº07', name: 'Nadal Orange', price: null, img: '/rack-assets/nadal-orange-cutout.webp', imageWidth: 279, spec: 'Silk tie', variantId: null},
  'dusty-rose': {n: 'Nº08', name: 'Dusty Rose', price: null, img: '/rack-assets/dusty-rose-cutout.webp', imageWidth: 307, spec: 'Silk tie', variantId: null}
};

export const PRODUCTS = Object.fromEntries(Object.entries(products).map(([id, product]) => [
  id, {...product, media: product.media ?? galleryMedia(id, product)}
]));

export const MAX_QTY = 5;
const KEY = 'curva-bag-v1';
const money = new Intl.NumberFormat('fr-FR', {style: 'currency', currency: 'EUR'});
export const fmt = cents => cents === null ? 'Pending' : money.format(cents / 100);
export const lineTotal = (product, qty) => product.price === null ? null : product.price * qty;
export const bagCount = lines => lines.reduce((sum, {qty}) => sum + qty, 0);
export const bagSubtotal = lines => lines.some(({id}) => PRODUCTS[id].price === null)
  ? null : lines.reduce((sum, {id, qty}) => sum + lineTotal(PRODUCTS[id], qty), 0);

function load() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    return value.filter(line => line && Object.hasOwn(PRODUCTS, line.id) && !seen.has(line.id) && seen.add(line.id))
      .map(({id, qty}) => ({id, qty: Math.max(1, Math.min(MAX_QTY, Math.floor(Number(qty)) || 1))}));
  } catch {
    return [];
  }
}

let lines = load();
const listeners = new Set();
const notify = () => listeners.forEach(listener => listener());

function save(next) {
  lines = next;
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* Keep the bag available for this visit. */ }
  notify();
}

function sync() {
  const saved = load();
  if (saved.length === lines.length && saved.every(({id, qty}, index) => lines[index].id === id && lines[index].qty === qty)) return;
  lines = saved;
  notify();
}

function onStorage(event) {
  if (event.key === KEY || event.key === null) sync();
}

function onPageShow(event) {
  if (event.persisted) sync();
}

export const bag = {
  snapshot: () => lines,
  subscribe(listener) {
    if (!listeners.size) {
      window.addEventListener('storage', onStorage);
      window.addEventListener('pageshow', onPageShow);
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (!listeners.size) {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('pageshow', onPageShow);
      }
    };
  },
  add(id) {
    if (!Object.hasOwn(PRODUCTS, id)) return;
    const existing = lines.find(line => line.id === id);
    if (existing) bag.set(id, existing.qty + 1);
    else save([...lines, {id, qty: 1}]);
  },
  set(id, qty) {
    if (qty < 1) return bag.remove(id);
    save(lines.map(line => line.id === id ? {...line, qty: Math.min(MAX_QTY, qty)} : line));
  },
  remove(id) { save(lines.filter(line => line.id !== id)); }
};
