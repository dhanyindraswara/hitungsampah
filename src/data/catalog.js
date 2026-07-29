// Product catalogue. Real Indonesian brand names with abstract colour-gradient
// placeholders standing in for packaging photography (per the design brief).
// Entries with a `key` are unbranded/unknown detections and resolve their label
// from the string table so they translate.
export const catalog = [
  { id: 'indomie', name: 'Indomie Goreng', c: '#E8562A', c2: '#B93A18' },
  { id: 'aqua', name: 'Aqua 600ml', c: '#8FD3F0', c2: '#4E9FC4' },
  { id: 'teh', name: 'Teh Botol Sosro', c: '#D6AE2E', c2: '#A07C15' },
  { id: 'kopiko', name: 'Kopiko Candy', c: '#7A5636', c2: '#4C3320' },
  { id: 'goodday', name: 'Good Day Coffee', c: '#C4553A', c2: '#8E3320' },
  { id: 'lemin', name: 'Le Minerale', c: '#5FB2DC', c2: '#2F7CA8' },
  { id: 'sq', name: 'SilverQueen', c: '#5A4A8C', c2: '#332A57' },
  { id: 'chitato', name: 'Chitato', c: '#C93F3F', c2: '#8C2222' },
  { id: 'ultra', name: 'Ultra Milk 250ml', c: '#4F6FB5', c2: '#2C4380' },
  { id: 'nabati', name: 'Richeese Nabati', c: '#E0A32B', c2: '#A97210' },
  { id: 'unk1', key: 'unkSnack', short: 'unkSnackShort', c: '#A6AEB6', c2: '#78828B' },
  { id: 'unk2', key: 'unkBag', short: 'unkBagShort', c: '#C0CBD0', c2: '#8E9BA1' },
  { id: 'unk3', key: 'unkBottle', short: 'unkBottleShort', c: '#AFC9C4', c2: '#7C9A94' },
];

export function findProduct(id) {
  return catalog.find((p) => p.id === id) || catalog[0];
}

/** Full product label — used in the review list and comparison rows. */
export function productLabel(product, t) {
  return product.key ? t[product.key] : product.name;
}

/** Short label — used on the camera overlay tags so chips never truncate. */
export function productShortLabel(product, t) {
  return product.short ? t[product.short] : productLabel(product, t);
}
