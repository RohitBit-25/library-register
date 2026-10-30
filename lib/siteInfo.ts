/**
 * The library's real-world details, shown on the landing page.
 *
 * Every field is optional and empty on purpose: a section appears only once
 * its details are filled in here, so the page never shows a made-up phone
 * number, address or review.
 *
 *   phones:   ['9876543210']                     → numbers listed + "Call" button
 *   whatsapp: '919876543210'  (country code, no +) → "WhatsApp us" button
 *   email:    'name@example.com'                 → email link
 *   address:  'Near …, Rajsamand, Rajasthan'
 *   mapsUrl:  'https://maps.app.goo.gl/…'        → "Map" button
 *   reviews:  [{ quote: '…', name: 'Priya M.', note: 'RAS aspirant' }]
 *
 * WhatsApp stays empty until the owner says which number takes WhatsApp.
 */
// Split as well as joined so search engines get the street and town apart.
export const ADDRESS_PARTS = { street: 'Opposite Maniratna Restaurant, JK Circle, Station Road', town: 'Kankroli', district: 'Rajsamand', state: 'Rajasthan' };
const ADDRESS = Object.values(ADDRESS_PARTS).join(', ');

export const SITE_INFO: {
  phones?: string[];
  whatsapp?: string;
  email?: string;
  address?: string;
  mapsUrl?: string;
  reviews: { quote: string; name: string; note?: string }[];
} = {
  phones: ['9462672576', '9829230576'],
  email: 'contact2shreegangaur@gmail.com',
  address: ADDRESS,
  // A Maps search for the address until the owner shares the pinned place link.
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Shree Gangaur Library, ${ADDRESS}`)}`,
  reviews: [],
};

/** "9462672576" → "94626 72576", the way numbers are read out in India. */
export const fmtPhone = (p: string) => p.replace(/^(\d{5})(\d{5})$/, '$1 $2');

/**
 * The one account every fee is paid into. The staff Add member QR used to
 * pay a different, personal account from the student request form's, so a
 * day's UPI collections were split across two accounts.
 */
export const UPI = { id: 'gangaur.972327@sbi', name: 'Gangaur Library' };

/**
 * A UPI QR payload with the amount and a note filled in, so the student
 * cannot pay the wrong sum and the payment says what it was for.
 */
export function upiPayLink(amount: number, note: string): string {
  const q = new URLSearchParams({ pa: UPI.id, pn: UPI.name, cu: 'INR' });
  if (amount > 0) q.set('am', amount.toFixed(2));
  if (note) q.set('tn', note.slice(0, 50));
  // UPI apps expect %20, not the + that URLSearchParams writes for spaces.
  return `upi://pay?${q.toString().replace(/\+/g, '%20')}`;
}
