/**
 * Real photographs of the library, shown on the landing page.
 *
 * Shot in the hall by the library (demo/Library file). Each shows a different
 * view: views the hero and gallery videos already show are left out, so no
 * scene repeats on the page. Width and height set each tile's shape; the
 * portrait still is cropped to match the two photos beside it. The page hides the gallery when this
 * list is empty, rather than showing stock pictures.
 */
export const PHOTOS: { src: string; alt: string; caption: string; width: number; height: number }[] = [
  { src: '/photos/hall-wide.webp', alt: 'The reading hall: rows of wooden study cabins with their own lights, black chairs, ceiling fans and an AC unit', caption: 'The whole hall', width: 1280, height: 960 },
  { src: '/photos/cabins-day.webp', alt: 'Study cabins and chairs along the aisle in daylight', caption: 'Your own cabin', width: 1080, height: 1650 },
  { src: '/photos/hall-evening.webp', alt: 'The hall in the evening, cabin lights on under the ceiling fans', caption: 'Lights on in the evening', width: 1280, height: 960 },
];
