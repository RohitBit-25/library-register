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
