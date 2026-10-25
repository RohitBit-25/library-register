/**
 * The library's real-world details, shown on the landing page.
 *
 * Every field is optional and empty on purpose: a section appears only once
 * its details are filled in here, so the page never shows a made-up phone
 * number, address or review.
 *
 *   phone:    '9876543210'                       → "Call" button
 *   whatsapp: '919876543210'  (country code, no +) → "WhatsApp us" button
 *   address:  'Near …, Rajsamand, Rajasthan 313324'
 *   mapsUrl:  'https://maps.app.goo.gl/…'        → "Open in Google Maps"
 *   reviews:  [{ quote: '…', name: 'Priya M.', note: 'RAS aspirant' }]
 */
export const SITE_INFO: {
  phone?: string;
  whatsapp?: string;
  address?: string;
  mapsUrl?: string;
  reviews: { quote: string; name: string; note?: string }[];
} = {
  reviews: [],
};

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
