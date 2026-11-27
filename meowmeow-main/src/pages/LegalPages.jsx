export function Contact() {
  return (
    <main className="doc">
      <div className="doc-head">
        <p className="doc-kicker">Contact</p>
        <h1>Contact</h1>
      </div>
      <nav className="doc-toc" aria-label="On this page">
        <ol>
          <li>
            <a href="#orders">Orders</a>
          </li>
          <li>
            <a href="#press">Press and collaborations</a>
          </li>
          <li>
            <a href="#studio">Studio</a>
          </li>
        </ol>
      </nav>
      <div className="doc-body">
        <section id="orders">
          <h2>Orders, shipping and returns</h2>
          <p>
            For anything about an order, write to{' '}
            <a href="mailto:contact@curva.world?subject=Order%20enquiry">contact@curva.world</a> with your order number.
            We reply within 2 working days, Monday to Friday.
          </p>
          <p>
            Before you write, you may find your answer on our{' '}
            <a href="/shipping-returns">Shipping &amp; Returns</a> page.
          </p>
        </section>
        <section id="press">
          <h2>Press, styling and collaborations</h2>
          <p>
            For press requests, styling loans and collaborations, write to{' '}
            <a href="mailto:contact@curva.world?subject=Press%20%2F%20collaboration">contact@curva.world</a>.
          </p>
        </section>
        <section id="studio">
          <h2>Studio</h2>
          <dl>
            <dt>Address</dt>
            <dd>
              CURVA, <span className="todo">[street address]</span>, Paris, France
            </dd>
            <dt>Email</dt>
            <dd>
              <a href="mailto:contact@curva.world">contact@curva.world</a>
            </dd>
            <dt>Phone</dt>
            <dd>
              <span className="todo">[optional]</span>
            </dd>
          </dl>
        </section>
      </div>
    </main>
  );
}

export function LegalNotice() {
  return (
    <main className="doc">
      <div className="doc-head">
        <p className="doc-kicker">Mentions légales</p>
        <h1>Legal notice</h1>
        <p className="doc-updated">Last updated 21 November 2026</p>
      </div>
      <nav className="doc-toc" aria-label="On this page">
        <ol>
          <li>
            <a href="#publisher">Publisher</a>
          </li>
          <li>
            <a href="#hosting">Hosting</a>
          </li>
          <li>
            <a href="#ip">Intellectual property</a>
          </li>
          <li>
            <a href="#law">Applicable law</a>
          </li>
        </ol>
      </nav>
      <div className="doc-body">
        <section id="publisher">
          <h2>Publisher</h2>
          <p>This website is published by:</p>
          <dl>
            <dt>Company</dt>
            <dd>
              CURVA <span className="todo">[legal form, e.g. SAS / micro-entreprise]</span>
            </dd>
            <dt>Share capital</dt>
            <dd>
              <span className="todo">[amount] €</span>
            </dd>
            <dt>Registered office</dt>
            <dd>
              <span className="todo">[street address]</span>, Paris, France
            </dd>
            <dt>Registration</dt>
            <dd>
              RCS Paris <span className="todo">[SIREN number]</span>
            </dd>
            <dt>Intra-EU VAT number</dt>
            <dd>
              <span className="todo">FR[xx][SIREN]</span>
            </dd>
            <dt>Publication director</dt>
            <dd>
              <span className="todo">[full name]</span>
            </dd>
            <dt>Email</dt>
            <dd>
              <a href="mailto:contact@curva.world">contact@curva.world</a>
            </dd>
          </dl>
        </section>
        <section id="hosting">
          <h2>Hosting</h2>
          <dl>
            <dt>Website</dt>
            <dd>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, United States</dd>
            <dt>Online shop and payment</dt>
            <dd>
              Shopify International Limited, Victoria Buildings, 2nd Floor, 1-2 Haddington Road, Dublin 4, D04 XN32,
              Ireland
            </dd>
          </dl>
        </section>
        <section id="ip">
          <h2>Intellectual property</h2>
          <p>
            All content on this website, including the CURVA name, wordmark and monogram, photographs, product designs,
            text and graphics, belongs to CURVA or is used with permission. Reproducing, adapting or distributing any of
            it, in whole or in part, without written permission from CURVA is prohibited and may constitute infringement
            under articles L.335-2 and following of the French Intellectual Property Code.
          </p>
        </section>
        <section id="law">
          <h2>Applicable law</h2>
          <p>
            This website and this legal notice are governed by French law. For how we handle personal data, see our{' '}
            <a href="/privacy">Privacy Policy</a>. For purchases, see our <a href="/terms">Terms of Sale</a>.
          </p>
        </section>
      </div>
    </main>
  );
}

export function Privacy() {
  return (
    <main className="doc">
      <div className="doc-head">
        <p className="doc-kicker">Politique de confidentialité</p>
        <h1>Privacy policy</h1>
        <p className="doc-updated">Last updated 21 November 2026</p>
      </div>
      <nav className="doc-toc" aria-label="On this page">
        <ol>
          <li>
            <a href="#controller">Who we are</a>
          </li>
          <li>
            <a href="#data">What we collect</a>
          </li>
          <li>
            <a href="#use">How we use it</a>
          </li>
          <li>
            <a href="#share">Who receives it</a>
          </li>
          <li>
            <a href="#transfers">Transfers outside the EU</a>
          </li>
          <li>
            <a href="#retention">How long we keep it</a>
          </li>
          <li>
            <a href="#storage">Cookies and storage</a>
          </li>
          <li>
            <a href="#rights">Your rights</a>
          </li>
        </ol>
      </nav>
      <div className="doc-body">
        <section id="controller">
          <h2>Who we are</h2>
          <p>
            CURVA <span className="todo">[legal form]</span>, <span className="todo">[address]</span>, Paris, France, is
            the data controller for personal data collected on this website. Contact us about your data at{' '}
            <a href="mailto:contact@curva.world">contact@curva.world</a>.
          </p>
        </section>
        <section id="data">
          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Order details:</strong> name, email, delivery address, phone number and the products you buy.
            </li>
            <li>
              <strong>Payment details:</strong> handled directly by our payment providers. We only receive confirmation
              that you paid, and the last digits and type of your card.
            </li>
            <li>
              <strong>Messages:</strong> what you send us when you contact us.
            </li>
            <li>
              <strong>Newsletter:</strong> your email, only if you opt in.
            </li>
          </ul>
        </section>
        <section id="use">
          <h2>How we use it</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">Purpose</th>
                <th scope="col">Legal basis (GDPR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Processing, delivering and invoicing your order, returns and refunds</td>
                <td>Contract, art. 6(1)(b)</td>
              </tr>
              <tr>
                <td>Keeping accounting records</td>
                <td>Legal obligation, art. 6(1)(c)</td>
              </tr>
              <tr>
                <td>Answering your messages</td>
                <td>Legitimate interest, art. 6(1)(f)</td>
              </tr>
              <tr>
                <td>Preventing fraud</td>
                <td>Legitimate interest, art. 6(1)(f)</td>
              </tr>
              <tr>
                <td>Sending the newsletter</td>
                <td>Consent, art. 6(1)(a)</td>
              </tr>
            </tbody>
          </table>
          <p>We do not sell your data, and we do not make decisions about you by automated means alone.</p>
        </section>
        <section id="share">
          <h2>Who receives it</h2>
          <p>Only the people at CURVA who need it, and these service providers, each for their own task:</p>
          <ul>
            <li>Shopify International Limited (Ireland): online shop and order management</li>
            <li>Shopify Payments, Stripe and PayPal: payment processing</li>
            <li>La Poste Colissimo and Chronopost: delivery</li>
            <li>Vercel Inc.: website hosting</li>
            <li>
              <span className="todo">[newsletter provider, if any]</span>
            </li>
          </ul>
        </section>
        <section id="transfers">
          <h2>Transfers outside the EU</h2>
          <p>
            Some providers, such as Vercel, Shopify and PayPal, may process data in the United States. These transfers
            are covered by the EU–US Data Privacy Framework, or by the European Commission's standard contractual
            clauses.
          </p>
        </section>
        <section id="retention">
          <h2>How long we keep it</h2>
          <ul>
            <li>Order data: for the duration of the contract, then 5 years for legal claims.</li>
            <li>Invoices and accounting records: 10 years, as French law requires.</li>
            <li>Newsletter: until you unsubscribe, or 3 years after your last contact with us.</li>
            <li>Messages: 3 years after your last contact with us.</li>
          </ul>
        </section>
        <section id="storage">
          <h2>Cookies and storage</h2>
          <p>
            This website does not use advertising or analytics cookies. Your bag is saved in your browser's local
            storage so it stays there between visits. That is strictly necessary for the service you ask for, so no
            consent is needed. You can clear it at any time in your browser settings.
          </p>
          <p>
            Our logo typeface is loaded from Google Fonts, which receives your IP address when the page loads. The
            secure payment page, run by Shopify, sets its own cookies that are needed for checkout.
          </p>
        </section>
        <section id="rights">
          <h2>Your rights</h2>
          <p>
            You have the right to access, correct, erase and port your data, to restrict or object to its use, and to
            withdraw consent at any time. You can also tell us what should happen to your data after your death. To use
            any of these rights, email <a href="mailto:contact@curva.world">contact@curva.world</a>. We reply within one
            month.
          </p>
          <p>
            If you think your rights have not been respected, you can complain to the CNIL, 3 place de Fontenoy, TSA
            80715, 75334 Paris Cedex 07,{' '}
            <a href="https://www.cnil.fr" rel="noopener">
              www.cnil.fr
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}

export function ShippingReturns() {
  return (
    <main className="doc">
      <div className="doc-head">
        <p className="doc-kicker">Livraison &amp; retours</p>
        <h1>Shipping &amp; returns</h1>
        <p className="doc-updated">Last updated 21 November 2026</p>
      </div>
      <nav className="doc-toc" aria-label="On this page">
        <ol>
          <li>
            <a href="#shipping">Shipping</a>
          </li>
          <li>
            <a href="#duties">Duties and taxes</a>
          </li>
          <li>
            <a href="#withdrawal">14-day withdrawal</a>
          </li>
          <li>
            <a href="#how">How to return</a>
          </li>
          <li>
            <a href="#refunds">Refunds</a>
          </li>
          <li>
            <a href="#form">Withdrawal form</a>
          </li>
        </ol>
      </nav>
      <div className="doc-body">
        <section id="shipping">
          <h2>Shipping</h2>
          <p>
            Orders ship from Paris within 1–2 working days. Every parcel is tracked, and you receive the tracking link
            by email.
          </p>
          <table>
            <thead>
              <tr>
                <th scope="col">Destination</th>
                <th scope="col">Method and time</th>
                <th scope="col">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>France and Monaco</td>
                <td>
                  Colissimo, home delivery
                  <br />
                  <small>2–3 working days</small>
                </td>
                <td>
                  4,90 €<br />
                  <small>free from 100,00 €</small>
                </td>
              </tr>
              <tr>
                <td>France and Monaco</td>
                <td>
                  Chronopost Express
                  <br />
                  <small>Next working day if ordered before 13:00</small>
                </td>
                <td>12,90 €</td>
              </tr>
              <tr>
                <td>European Union</td>
                <td>
                  Colissimo International
                  <br />
                  <small>4–8 working days</small>
                </td>
                <td>
                  9,90 €<br />
                  <small>free from 150,00 €</small>
                </td>
              </tr>
              <tr>
                <td>Switzerland and United Kingdom</td>
                <td>
                  Colissimo International
                  <br />
                  <small>5–10 working days</small>
                </td>
                <td>14,90 €</td>
              </tr>
            </tbody>
          </table>
        </section>
        <section id="duties">
          <h2>Duties and taxes</h2>
          <p>
            Prices include French VAT. Within the EU there is nothing more to pay. Orders to Switzerland and the United
            Kingdom leave the EU, so the carrier may charge import duties and local taxes on delivery. These are paid by
            the recipient.
          </p>
        </section>
        <section id="withdrawal">
          <h2>14-day withdrawal</h2>
          <p>
            You have 14 days from the day you receive your order to change your mind, without giving a reason. Ties must
            come back unworn, with their labels, in the original packaging.
          </p>
        </section>
        <section id="how">
          <h2>How to return</h2>
          <ol>
            <li>
              Email <a href="mailto:contact@curva.world">contact@curva.world</a> with your order number, or send the{' '}
              <a href="#form">withdrawal form</a>, within 14 days of delivery.
            </li>
            <li>Pack the ties carefully in their original packaging.</li>
            <li>
              Send the parcel within 14 days of telling us, to: CURVA, <span className="todo">[returns address]</span>,
              Paris, France. Return shipping is paid by you{' '}
              <span className="todo">[or: we email you a prepaid label]</span>. We recommend a tracked service.
            </li>
          </ol>
        </section>
        <section id="refunds">
          <h2>Refunds</h2>
          <p>
            We refund the product price and the standard shipping cost within 14 days of receiving your withdrawal. We
            may wait until we receive the ties back, or until you send proof of shipping. The refund goes to the payment
            method you used. If you chose Chronopost Express, the difference from standard shipping is not refunded.
          </p>
          <p>
            If a tie arrives damaged or faulty, email us within 3 days with photos. We will replace or refund it, and
            cover the return cost.
          </p>
        </section>
        <section id="form">
          <h2>Model withdrawal form</h2>
          <p>
            Fill in and send this form only if you want to withdraw from your purchase. Under article R.221-1 of the
            French Consumer Code, you can also simply email us.
          </p>
          <div className="form-box">
            <p>
              To: CURVA, <span className="todo">[address]</span>, Paris, France,{' '}
              <a href="mailto:contact@curva.world">contact@curva.world</a>
            </p>
            <p>I hereby give notice that I withdraw from my contract for the sale of the following goods:</p>
            <p>Ordered on: ______________ / received on: ______________</p>
            <p>Order number: ______________</p>
            <p>Name of consumer: ______________</p>
            <p>Address of consumer: ______________</p>
            <p>Signature of consumer (only if this form is sent on paper): ______________</p>
            <p style={{ margin: 0.0 }}>Date: ______________</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export function Terms() {
  return (
    <main className="doc">
      <div className="doc-head">
        <p className="doc-kicker">Conditions générales de vente</p>
        <h1>Terms of sale</h1>
        <p className="doc-updated">Last updated 21 November 2026</p>
      </div>
      <nav className="doc-toc" aria-label="On this page">
        <ol>
          <li>
            <a href="#scope">Scope</a>
          </li>
          <li>
            <a href="#products">Products</a>
          </li>
          <li>
            <a href="#prices">Prices</a>
          </li>
          <li>
            <a href="#order">Placing an order</a>
          </li>
          <li>
            <a href="#payment">Payment</a>
          </li>
          <li>
            <a href="#delivery">Delivery</a>
          </li>
          <li>
            <a href="#withdrawal">Right of withdrawal</a>
          </li>
          <li>
            <a href="#guarantees">Legal guarantees</a>
          </li>
          <li>
            <a href="#liability">Liability</a>
          </li>
          <li>
            <a href="#data">Personal data</a>
          </li>
          <li>
            <a href="#disputes">Disputes and mediation</a>
          </li>
        </ol>
      </nav>
      <div className="doc-body">
        <section id="scope">
          <h2>1. Scope</h2>
          <p>
            These Terms of Sale apply to every order placed on this website by a consumer with CURVA{' '}
            <span className="todo">[legal form]</span>, registered office <span className="todo">[address]</span>,
            Paris, France, RCS Paris <span className="todo">[SIREN]</span> ("CURVA", "we"). You accept them when you
            place an order. The version that applies is the one online on the day you order.
          </p>
        </section>
        <section id="products">
          <h2>2. Products</h2>
          <p>
            CURVA sells silk ties, made in limited editions. Each product page states its main characteristics, such as
            material, dimensions and edition size. Photographs are as faithful as possible, but colours can vary
            slightly depending on your screen.
          </p>
          <p>
            Products are offered while stock lasts. Because editions are small, an item in your bag is not reserved
            until payment is complete. If an item becomes unavailable after you order, we will tell you and refund you
            in full within 14 days.
          </p>
        </section>
        <section id="prices">
          <h2>3. Prices</h2>
          <p>
            Prices are in euros and include French VAT (20%). Shipping costs are shown before you confirm your order and
            are added to the total. For deliveries outside the European Union, import duties and local taxes may be
            charged on arrival and are paid by the recipient.
          </p>
        </section>
        <section id="order">
          <h2>4. Placing an order</h2>
          <ol>
            <li>Add products to your bag and go to checkout.</li>
            <li>Enter your email, delivery address and phone number, and choose a shipping method.</li>
            <li>Check your order and the total price, and accept these Terms of Sale.</li>
            <li>Confirm and pay on the secure payment page. The contract is concluded when you confirm payment.</li>
          </ol>
          <p>
            We send an order confirmation by email, with a summary of your order and these Terms of Sale. We may refuse
            or cancel an order in case of an abnormal order, suspected fraud or an existing dispute with the customer.
          </p>
        </section>
        <section id="payment">
          <h2>5. Payment</h2>
          <p>
            Payment is taken in full when you order, through Shopify Payments or PayPal. We accept Carte Bancaire, Visa,
            Mastercard, American Express, Apple Pay, Google Pay and PayPal. Payments are encrypted and handled by the
            payment provider. CURVA never sees or stores your card details. Card payments may require 3-D Secure
            authentication.
          </p>
        </section>
        <section id="delivery">
          <h2>6. Delivery</h2>
          <p>
            We deliver to France, Monaco, the European Union, Switzerland and the United Kingdom. Delivery methods,
            costs and times are listed on our <a href="/shipping-returns">Shipping &amp; Returns</a> page and at
            checkout.
          </p>
          <p>
            Delivery times run from the day the parcel ships. Unless we agree another date, we deliver within 30 days of
            your order at the latest. If we do not, you may cancel the order under the conditions of article L.216-6 of
            the French Consumer Code. The risk of loss or damage passes to you when you, or a person you nominate,
            physically receive the parcel.
          </p>
          <p>
            Please check your parcel on delivery. If it is damaged or something is missing, tell us within 3 days at{' '}
            <a href="mailto:contact@curva.world">contact@curva.world</a>, with photos if possible.
          </p>
        </section>
        <section id="withdrawal">
          <h2>7. Right of withdrawal</h2>
          <p>
            Under articles L.221-18 and following of the French Consumer Code, you have{' '}
            <strong>14 days from the day you receive your order</strong> to withdraw from your purchase, without giving
            a reason.
          </p>
          <p>
            To withdraw, send us a clear statement, for example by email to{' '}
            <a href="mailto:contact@curva.world">contact@curva.world</a>, or use the{' '}
            <a href="/shipping-returns#form">model withdrawal form</a>. Then return the products within 14 days of
            telling us. The cost of returning them is paid by you{' '}
            <span className="todo">[or: CURVA provides a prepaid label, choose one]</span>.
          </p>
          <p>
            Products must come back unworn, in their original condition and packaging. You are responsible for any loss
            in value caused by handling beyond what is needed to check the nature, characteristics and working of the
            product.
          </p>
          <p>
            We refund all payments received, including standard delivery costs, within 14 days of receiving your
            withdrawal. We may wait until we have received the products back, or until you have sent proof of shipping.
            The refund uses the same payment method you used for the order. If you chose a more expensive delivery
            method than our standard one, the extra cost is not refunded.
          </p>
        </section>
        <section id="guarantees">
          <h2>8. Legal guarantees</h2>
          <p>
            Whatever the commercial terms, CURVA is bound by the legal guarantee of conformity (articles L.217-3 to
            L.217-20 of the French Consumer Code) and the guarantee against hidden defects (articles 1641 to 1649 of the
            French Civil Code).
          </p>
          <p>
            <strong>Guarantee of conformity.</strong> You have 2 years from delivery to claim. You can choose between
            repair or replacement, unless the cost is clearly disproportionate. For 24 months after delivery, you do not
            need to prove a defect existed at delivery. The guarantee applies regardless of any commercial guarantee.
          </p>
          <p>
            <strong>Hidden defects.</strong> You have 2 years from discovering the defect to claim. You can choose
            between cancelling the sale or a price reduction.
          </p>
          <p>
            To use either guarantee, contact us at <a href="mailto:contact@curva.world">contact@curva.world</a>.
          </p>
        </section>
        <section id="liability">
          <h2>9. Liability</h2>
          <p>
            CURVA is not liable for failure to perform the contract caused by you, by an unforeseeable and unavoidable
            act of a third party, or by force majeure.
          </p>
        </section>
        <section id="data">
          <h2>10. Personal data</h2>
          <p>
            We use your personal data to process and deliver your order. For details and your rights, see our{' '}
            <a href="/privacy">Privacy Policy</a>.
          </p>
        </section>
        <section id="disputes">
          <h2>11. Disputes and mediation</h2>
          <p>
            These Terms of Sale are governed by French law. If you have a complaint, contact us first at{' '}
            <a href="mailto:contact@curva.world">contact@curva.world</a>. We will try to find a solution with you.
          </p>
          <p>
            If we cannot settle it, you can refer the dispute free of charge to the consumer mediator{' '}
            <span className="todo">[mediator name, address and website]</span>, under articles L.612-1 and following of
            the French Consumer Code. You can also bring the dispute before the competent French court.
          </p>
        </section>
      </div>
    </main>
  );
}
