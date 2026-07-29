// Trips shipped with the app so History and the home statistics are populated
// on a fresh install. Written to storage once, then owned by the device.
export const seedTrips = [
  { id: 'TRT-2607-1183', mtn: 'Gunung Semeru', gate: 'Ranu Pani', date: '12 Jul 2026', pct: 100, items: 41 },
  { id: 'TRT-2506-0942', mtn: 'Gunung Rinjani', gate: 'Sembalun', date: '28 Jun 2026', pct: 94, items: 33 },
  { id: 'TRT-2405-0517', mtn: 'Gunung Prau', gate: 'Patak Banteng', date: '09 Jun 2026', pct: 100, items: 18 },
];

export const gateOptions = ['Ranu Pani', 'Ayek-Ayek', 'Tumpang'];

// Other hikers waiting at the checkpoint, shown on the officer screen.
export const gateQueue = [
  { ini: 'BP', name: 'Bagas Prakoso', id: 'TRT-2907-2041', group: '4 org', st: 'qScanning' },
  { ini: 'NR', name: 'Nadia Ramadhani', id: 'TRT-2907-2038', group: '2 org', st: 'qVerified' },
  { ini: 'AS', name: 'Arif Setiawan', id: 'TRT-2907-2033', group: '6 org', st: 'qWaiting' },
];
