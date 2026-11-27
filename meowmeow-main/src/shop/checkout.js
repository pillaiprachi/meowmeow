const EU = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
const regions = new Intl.DisplayNames(['en'], {type: 'region'});
export const countryName = code => regions.of(code);
export const countries = ['FR', 'MC', ...EU.toSorted((a, b) => countryName(a).localeCompare(countryName(b))), 'CH', 'GB'];
export const zoneOf = country => country === 'FR' || country === 'MC' ? 'fr' : EU.includes(country) ? 'eu' : 'intl';

// Rates are in euro cents and mirror the Shopify delivery options.
const RATES = {
  fr: [
    {id: 'colissimo', name: 'Colissimo, home delivery', time: '2–3 working days, tracked, signature-free', price: 490, freeFrom: 10000},
    {id: 'chronopost', name: 'Chronopost Express', time: 'Next working day if ordered before 13:00', price: 1290}
  ],
  eu: [{id: 'colissimo-eu', name: 'Colissimo International', time: '4–8 working days, tracked', price: 990, freeFrom: 15000}],
  intl: [{id: 'colissimo-intl', name: 'Colissimo International', time: '5–10 working days, tracked', price: 1490}]
};

export const ratesFor = country => RATES[zoneOf(country)];
export const shippingCost = (rate, subtotal) => {
  if (!rate.freeFrom) return rate.price;
  if (subtotal === null) return null;
  return subtotal >= rate.freeFrom ? 0 : rate.price;
};

const numericPostcodes = new Set(['DE','ES','IT','FI','EE','HR','LT','CZ','SK','GR','AT','BE','BG','CY','DK','HU','LU','SI']);
export const zipInputMode = country => zoneOf(country) === 'fr' || numericPostcodes.has(country) ? 'numeric' : 'text';

const postcodes = {FR: /^\d{5}$/, MC: /^980\d{2}$/, DE: /^\d{5}$/, ES: /^\d{5}$/, IT: /^\d{5}$/, BE: /^\d{4}$/, NL: /^\d{4}\s?[A-Za-z]{2}$/, CH: /^\d{4}$/, GB: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, PT: /^\d{4}-\d{3}$/, LU: /^\d{4}$/, AT: /^\d{4}$/};
const checks = {
  email: value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? '' : 'Enter a valid email address, like name@example.com.',
  first: value => value ? '' : 'Enter your first name.',
  last: value => value ? '' : 'Enter your last name.',
  address1: value => value ? '' : 'Enter your street address.',
  city: value => value ? '' : 'Enter your city.',
  zip(value, country) {
    if (!value) return 'Enter your postcode.';
    const pattern = postcodes[country];
    if (!pattern || pattern.test(value)) return '';
    return country === 'FR' ? 'French postcodes have 5 digits, like 75003.' : 'Check the postcode format for this country.';
  },
  phone(value, country) {
    const number = value.replace(/[\s.\-()]/g, '');
    if (!number) return 'Enter a phone number so the carrier can contact you.';
    if (zoneOf(country) === 'fr') {
      return /^(?:\+33|0033|0)[1-9]\d{8}$/.test(number) || /^\+377\d{8}$/.test(number)
        ? '' : 'Enter a French number, like 06 12 34 56 78 or +33 6 12 34 56 78.';
    }
    return /^\+?\d{7,15}$/.test(number) ? '' : 'Enter a phone number including the country code, like +44 20 7946 0000.';
  }
};

export const validatedFields = ['email', 'first', 'last', 'address1', 'zip', 'city', 'phone'];
export const validationMessage = (field, value, country) => checks[field]?.(value.trim(), country) ?? '';
