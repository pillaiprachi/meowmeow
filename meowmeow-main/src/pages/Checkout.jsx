import {Fragment, useLayoutEffect, useRef, useState} from 'react';
import {useBag} from '../shop/Bag';
import {bagCount, bagSubtotal, fmt, lineTotal, PRODUCTS, SHOP} from '../shop/store';
import {countries, countryName, ratesFor, shippingCost, validatedFields, validationMessage, zipInputMode, zoneOf} from '../shop/checkout';

const shippingLabel = cost => cost === 0 ? 'Free' : fmt(cost);
const paymentMethods = ['Carte Bancaire', 'Visa', 'Mastercard', 'American Express', 'Apple Pay', 'Google Pay', 'PayPal'];

function Field({name, label, hint, full, error, ...input}) {
  return (
    <div className={`field${full ? ' field--full' : ''}`}>
      <label htmlFor={name}>{label}{hint && <> <small>{hint}</small></>}</label>
      <input id={name} name={name} aria-describedby={input.required ? `${name}-err` : undefined}
        aria-invalid={error ? true : undefined} {...input} />
      {input.required && <span className="err" id={`${name}-err`}>{error}</span>}
    </div>
  );
}

function OrderSummary({lines, subtotal, shipping, total}) {
  return (
    <aside className="co-summary" aria-labelledby="summary-title">
      <h2 id="summary-title">Your order</h2>
      <ul id="co-lines">
        {lines.map(({id, qty}) => {
          const tie = PRODUCTS[id];
          return (
            <li key={id}>
              <img src={tie.img} alt="" width="56" height="72" />
              <span>{tie.n} {tie.name}<small>{tie.spec} · Qty {qty}</small></span>
              <span>{tie.price === null ? 'Price pending' : fmt(lineTotal(tie, qty))}</span>
            </li>
          );
        })}
      </ul>
      <dl className="co-totals">
        <div><dt>Subtotal</dt><dd id="t-sub">{fmt(subtotal)}</dd></div>
        <div><dt>Shipping</dt><dd id="t-ship">{shippingLabel(shipping)}</dd></div>
        <div className="co-total"><dt>Total</dt><dd id="t-total">{fmt(total)}</dd></div>
        <div className="co-vat"><dt>Including French VAT (20%)</dt><dd id="t-vat">{fmt(total === null ? null : Math.round(total - total / 1.2))}</dd></div>
      </dl>
    </aside>
  );
}

export function Checkout() {
  const lines = useBag();
  const [country, setCountry] = useState('FR');
  const [rateId, setRateId] = useState(null);
  const [errors, setErrors] = useState({});
  const [receipt, setReceipt] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const receiptPanel = useRef(null);
  const rates = ratesFor(country);
  const rate = rates.find(option => option.id === rateId) || rates[0];
  const subtotal = bagSubtotal(lines);
  const shipping = shippingCost(rate, subtotal);
  const total = subtotal === null || shipping === null ? null : subtotal + shipping;
  const zone = zoneOf(country);
  const live = SHOP.checkoutEnabled && lines.length > 0 && lines.every(({id}) => PRODUCTS[id].variantId && PRODUCTS[id].price !== null);

  useLayoutEffect(() => { if (receipt) receiptPanel.current.focus(); }, [receipt]);

  function changeCountry(event) {
    const next = event.target.value;
    const {zip, phone} = event.target.form.elements;
    setCountry(next);
    setRateId(ratesFor(next).some(option => option.id === rate.id) ? rate.id : null);
    setErrors(previous => ({...previous,
      zip: zip.value ? validationMessage('zip', zip.value, next) : previous.zip,
      phone: phone.value ? validationMessage('phone', phone.value, next) : previous.phone
    }));
  }

  function checkField(event) {
    const {name, value} = event.target;
    if (!validatedFields.includes(name)) return;
    const shouldCheck = event.type === 'blur' ? Boolean(value) : Boolean(errors[name]);
    if (shouldCheck) setErrors(previous => ({...previous, [name]: validationMessage(name, value, country)}));
  }

  function submit(event) {
    event.preventDefault();
    const {elements} = event.currentTarget;
    const messages = Object.fromEntries(validatedFields.map(name => [name, validationMessage(name, elements[name].value, country)]));
    if (!elements.cgv.checked) messages.cgv = 'Please accept the Terms of Sale to continue.';
    setErrors(messages);
    const invalid = Object.keys(messages).find(name => messages[name]);
    if (invalid) {
      elements[invalid].focus();
      return;
    }
    if (live) {
      setRedirecting(true);
      const items = lines.map(({id, qty}) => `${PRODUCTS[id].variantId}:${qty}`).join(',');
      location.assign(`https://${SHOP.domain}/cart/${items}?locale=en`);
      return;
    }
    const count = bagCount(lines);
    const city = elements.city.value.trim();
    const totalLabel = total === null ? 'Your total is pending product pricing.' : `Total ${fmt(total)}.`;
    setReceipt({name: elements.first.value.trim(), summary: `${count} ${count === 1 ? 'tie' : 'ties'} via ${rate.name} to ${city}, ${countryName(country)}. ${totalLabel}`});
  }

  return (
    <main className="co" id="checkout">
      <h1>Checkout</h1>
      {receipt ? (
        <div className="co-done" id="co-done" ref={receiptPanel} tabIndex={-1}>
          <h2>Thank you, <span id="done-name">{receipt.name}</span>.</h2>
          <p id="done-copy">{receipt.summary}</p>
          <p><strong>Checkout preview only. No order was placed and no payment was taken.</strong></p>
          <a className="btn" href="/curva">Back to CURVA</a>
        </div>
      ) : lines.length === 0 ? (
        <div className="co-empty" id="co-empty">
          <p>Your bag is empty.</p>
          <a className="btn" href="/curva#rack">Browse the collection</a>
        </div>
      ) : (
        <form className="co-form" id="co-form" noValidate onSubmit={submit} onBlur={checkField} onChange={checkField}>
          {!live && <p className="co-preview" id="co-preview">Checkout preview. Use sample details to review shipping and totals. Live payment is unavailable.</p>}
          <fieldset>
            <legend><span>01</span>Contact</legend>
            <div className="fields">
              <Field name="email" label="Email" type="email" autoComplete="email" error={errors.email} required full />
            </div>
            <label className="check" style={{marginTop: 14}}><input type="checkbox" name="newsletter" /> Email me about new chapters and releases. You can unsubscribe at any time.</label>
          </fieldset>
          <fieldset>
            <legend><span>02</span>Delivery address</legend>
            <div className="fields">
              <div className="field field--full">
                <label htmlFor="country">Country / region</label>
                <select id="country" name="country" autoComplete="country" required value={country} onChange={changeCountry}>
                  {countries.map((code, index) => (
                    <Fragment key={code}>
                      {index === 2 && <option disabled>──────────</option>}
                      <option value={code}>{countryName(code)}</option>
                    </Fragment>
                  ))}
                </select>
              </div>
              <Field name="first" label="First name" autoComplete="given-name" error={errors.first} required />
              <Field name="last" label="Last name" autoComplete="family-name" error={errors.last} required />
              <Field name="address1" label="Street address" autoComplete="address-line1" error={errors.address1} required full />
              <Field name="address2" label="Apartment, building, door code" hint="(optional)" autoComplete="address-line2" full />
              <Field name="zip" label="Postcode" autoComplete="postal-code" inputMode={zipInputMode(country)} error={errors.zip} required />
              <Field name="city" label="City" autoComplete="address-level2" error={errors.city} required />
              <Field name="phone" label="Phone" hint="(for delivery updates from the carrier)" type="tel" autoComplete="tel"
                placeholder={zone === 'fr' ? '+33 6 12 34 56 78' : '+44 20 7946 0000'} error={errors.phone} required full />
            </div>
          </fieldset>
          <fieldset>
            <legend><span>03</span>Shipping</legend>
            <div className="rates" id="rates">
              {rates.map(option => (
                <label className="rate" key={option.id}>
                  <input type="radio" name="rate" value={option.id} checked={option.id === rate.id} onChange={() => setRateId(option.id)} />
                  <span><b>{option.name}</b><small>{option.time}{option.freeFrom ? ` · free from ${fmt(option.freeFrom)}` : ''}</small></span>
                  <span className="rate-price">{shippingLabel(shippingCost(option, subtotal))}</span>
                </label>
              ))}
            </div>
            <p className="co-note" id="rate-note">{zone === 'intl'
              ? 'Orders to Switzerland and the United Kingdom leave the EU. Import duties and local taxes may be charged by the carrier on delivery and are paid by the recipient.'
              : 'Orders ship from Paris within 1–2 working days. Every parcel is tracked.'}</p>
          </fieldset>
          <fieldset>
            <legend><span>04</span>Payment</legend>
            <ul className="pay-marks" aria-label="Accepted payment methods">{paymentMethods.map(name => <li key={name}>{name}</li>)}</ul>
            <p className="co-note">Payment is completed on Shopify's encrypted payment page. CURVA never sees or stores your card details. Your card is charged when you confirm payment there.</p>
          </fieldset>
          <label className="check">
            <input type="checkbox" id="cgv" name="cgv" required aria-describedby="cgv-err"
              onChange={event => { if (event.target.checked) setErrors(previous => ({...previous, cgv: ''})); }} />
            <span>I have read and accept the <a href="/terms" target="_blank">Terms of Sale</a> and the <a href="/privacy" target="_blank">Privacy Policy</a>.</span>
          </label>
          <span className="err co-error" id="cgv-err" role="alert">{errors.cgv}</span>
          <p className="co-note">You have 14 days from delivery to withdraw from your purchase without giving a reason. See <a href="/shipping-returns#withdrawal">Shipping &amp; Returns</a>.</p>
          <button className="btn btn--solid co-submit" type="submit" id="co-submit" disabled={redirecting}>
            {redirecting ? 'Opening secure payment…' : live ? 'Continue to secure payment' : 'Preview order'}
          </button>
        </form>
      )}
      {lines.length > 0 && <OrderSummary lines={lines} subtotal={subtotal} shipping={shipping} total={total} />}
    </main>
  );
}
