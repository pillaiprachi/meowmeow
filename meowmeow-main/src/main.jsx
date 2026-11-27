import {useLayoutEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {SiteFooter, SiteHeader} from './components/SiteChrome';
import {BagProvider} from './shop/Bag';
import {PRODUCTS} from './shop/store';
import {routes} from './routes.mjs';
import './styles/home.css';
import './styles/brand.css';
import './styles/site-header.css';
import './styles/campaign.css';
import './styles/archive.css';
import './styles/lookbook.css';
import './styles/about.css';
import './styles/shop.css';
import './styles/product-media.css';
import './styles/helix.css';

const legal = () => import('./pages/LegalPages');
const loadPage = {
  home: () => import('./pages/Home').then(module => module.Home),
  catalog: () => import('./pages/Catalog').then(module => module.Catalog),
  checkout: () => import('./pages/Checkout').then(module => module.Checkout),
  contact: () => legal().then(module => module.Contact),
  legal: () => legal().then(module => module.LegalNotice),
  privacy: () => legal().then(module => module.Privacy),
  shipping: () => legal().then(module => module.ShippingReturns),
  terms: () => legal().then(module => module.Terms)
};

function Storefront({Page, home, checkout, catalog}) {
  useLayoutEffect(() => {
    const anchor = location.hash.slice(1);
    const restored = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
    const tie = new URLSearchParams(location.search).get('tie');
    const rackDeepLink = home && anchor === 'rack' && Object.hasOwn(PRODUCTS, tie);
    if (!anchor || restored || rackDeepLink) return;
    const frame = requestAnimationFrame(() => {
      let id;
      try { id = decodeURIComponent(anchor); } catch { return; }
      document.getElementById(id)?.scrollIntoView({behavior: 'instant'});
    });
    return () => cancelAnimationFrame(frame);
  }, [home]);

  return (
    <BagProvider checkout={checkout}>
      <SiteHeader home={home} checkout={checkout} catalog={catalog} />
      <Page />
      <SiteFooter home={home} />
    </BagProvider>
  );
}

function NotFound() {
  return <main className="doc"><h1>Page not found</h1><p><a href="/">Back to CURVA</a></p></main>;
}

async function start() {
  const path = location.pathname.replace(/(?:\.html|\/)$/, '') || '/';
  const route = routes[path];
  if (route && path !== location.pathname) {
    history.replaceState(history.state, '', path + location.search + location.hash);
  }
  if (route?.page === 'campaign') {
    location.replace('/catalog' + location.search + (location.hash || '#campaign-gallery'));
    return;
  }
  const page = route?.page;
  const home = page === 'home';
  const catalog = page === 'catalog';
  const checkout = page === 'checkout';
  document.title = route?.title ?? 'Page not found | CURVA';
  document.body.className = home ? 'home' : catalog ? 'campaign-page' : 'page';
  const Page = page ? await loadPage[page]() : NotFound;
  createRoot(document.getElementById('root')).render(<Storefront Page={Page} home={home} checkout={checkout} catalog={catalog} />);
}

start();
