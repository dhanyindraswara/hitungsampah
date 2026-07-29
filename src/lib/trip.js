import { gateOptions } from '../data/seedTrips';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n) => String(n).padStart(2, '0');

/** "29 Jul 2026" — the format used across the trip cards and summaries. */
export function formatDate(date) {
  return `${pad(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** TRT-DDMM-NNNN, generated on the device when a trip is created. */
export function generateTripId(now = new Date()) {
  const serial = String(Math.floor(Math.random() * 9000) + 1000);
  return `TRT-${pad(now.getDate())}${pad(now.getMonth() + 1)}-${serial}`;
}

export function createTrip(now = new Date()) {
  return {
    id: generateTripId(now),
    hiker: '',
    phone: '',
    nik: '',
    mtn: '',
    gate: gateOptions[0],
    group: 4,
    climb: formatDate(now),
    ret: formatDate(addDays(now, 2)),
    notes: '',
  };
}

/**
 * A trip pre-filled the way the design shows it — the officer at the gate has
 * usually already taken these details, so the form opens populated rather than
 * empty.
 */
export function createSampleTrip(now = new Date()) {
  return {
    ...createTrip(now),
    hiker: 'Bagas Prakoso',
    phone: '0812 3344 5566',
    mtn: 'Gunung Semeru',
  };
}
