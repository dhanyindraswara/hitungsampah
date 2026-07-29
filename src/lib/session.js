// Capture metadata attached to every scan. Coordinates are a trailhead
// placeholder — swap in navigator.geolocation once location permission is
// wired up; the time is real.
export const GPS_PLACEHOLDER = '-8.1077, 112.9220';

export function formatTime(date = new Date()) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
