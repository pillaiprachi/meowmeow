import {useBag, useOpenBag} from '../shop/Bag';
import {bagCount} from '../shop/store';

export function SiteHeader({home, catalog, checkout}) {
  const openBag = useOpenBag();
  const count = bagCount(useBag());
  const homeLink = home ? '#top' : '/curva';

  return (
    <header id="nav" className={`site-header${home ? ' site-header--fixed site-header--over-hero' : ''}`}>
      <nav className="site-links" aria-label="Main">
        <a href={homeLink} aria-current={home ? 'page' : undefined}>HOME</a>
        <a href="/catalog" aria-current={catalog ? 'page' : undefined}>CATALOG</a>
      </nav>
      <a className="site-brand" href={homeLink} aria-label="CURVA home">
        <img src="/brand-assets/curva-monogram.svg" width="54" height="62" alt="" />
      </a>
      <div className="site-actions">
        <details className="site-currency">
          <summary aria-label="Currency: EUR">EUR</summary>
          <p>Prices are shown in euros.</p>
        </details>
        <a className="site-icon" href="https://curva.world/customer_authentication/redirect?locale=en&amp;region_country=FR" aria-label="CURVA store account">
          <img src="/brand-assets/account.svg" width="25" height="25" alt="" />
        </a>
        <button className="site-icon site-bag" type="button" data-bag-open onClick={openBag} aria-label={`Bag (${count})`} aria-haspopup={checkout ? undefined : 'dialog'}>
          <img src="/brand-assets/bag.svg" width="25" height="25" alt="" />
          <span className="site-bag-count" data-bag-count aria-hidden="true" hidden={count === 0}>{count}</span>
        </button>
      </div>
    </header>
  );
}

export function SiteFooter({home}) {
  return (
    <footer className="site-footer" id={home ? 'site-info' : undefined}>
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <a className="footer-mark" href={home ? '#top' : '/curva'}>CURVA</a>
          <p className="footer-tag">Silk ties between sport, culture and design. Paris.</p>
          {home && <nav className="footer-explore" aria-label="Explore CURVA"><a href="#about">About</a><a href="#lookbook">Lookbook</a></nav>}
        </div>
        <nav aria-labelledby="f-care">
          <h2 id="f-care">{home ? 'Orders & support' : 'Customer care'}</h2>
          {home && <a href="/checkout">Checkout</a>}
          <a href="/shipping-returns">Shipping &amp; returns</a>
          <a href="/contact">Contact</a>
        </nav>
        <nav aria-labelledby="f-legal">
          <h2 id="f-legal">Legal</h2>
          <a href="/terms">Terms of sale</a>
          <a href="/privacy">Privacy policy</a>
          <a href="/legal-notice">Legal notice</a>
        </nav>
        <div className="site-footer-base"><span>© 2026 CURVA · Paris, France</span><span>Prices in euros, French VAT included</span></div>
      </div>
    </footer>
  );
}
