/**
 * The library's real-world details, shown on the landing page.
 *
 * Every field is optional and empty on purpose: a section appears only once
 * its details are filled in here, so the page never shows a made-up phone
 * number, address or review.
 *
 *   phones:   ['9876543210']                     → numbers listed + "Call" button
 *   whatsapp: 'https://wa.me/…'                   → "WhatsApp us" buttons (a full wa.me link)
 *   email:    'name@example.com'                 → email link
 *   address:  'Near …, Rajsamand, Rajasthan'
 *   mapsUrl:  'https://maps.app.goo.gl/…'        → "Map" button
 *   instagram:'https://www.instagram.com/…'      → Instagram links
 *   reviews:  [{ quote: '…', name: 'Priya M.', note: 'RAS aspirant' }]
 *
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
  instagram?: string;
  geo?: { lat: number; lng: number };
  reviews: { quote: string; name: string; note?: string }[];
} = {
  phones: ['9462672576', '9829230576'],
  email: 'contact2shreegangaur@gmail.com',
  // The library's WhatsApp message link (shared by the owner); opens a chat with the library.
  whatsapp: 'https://wa.me/message/FWYM7Q3NTL2XN1',
  address: ADDRESS,
  // The library's own pinned place (shared by the owner); it opens श्री गणगौर Library on Google Maps.
  mapsUrl: 'https://maps.app.goo.gl/VboJs7eJcBXo3CYL9',
  geo: { lat: 25.0441995, lng: 73.9009279 },
  instagram: 'https://www.instagram.com/shri_gangaur_library/',
  // Real Google reviews, as the library shared them on its Instagram (September 2025).
  reviews: [
    { quote: 'Good library with fully new accommodations! Everything is fantastic for the students. A quiet and happy environment.', name: 'Thomas P.', note: 'Google review' },
    { quote: 'A great spot to study! The atmosphere is quiet and peaceful, perfect for focused learning.', name: 'Surbhi M.', note: 'Google review' },
    { quote: 'Owner is very polite, and the price is reasonable in Kankroli compared to other libraries.', name: 'Sita D.', note: 'Google review' },
  ],
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
