/* ============================================================
   Garage scene — shared bits for the drive-out / drive-in
   ------------------------------------------------------------
   Kept out of GarageScene.tsx so pages that never load the
   scene (a car's log) can import them cheaply.
   ============================================================ */

/**
 * The view-transition-name the scene puts on a car's art when it drives
 * out (and when it drives back in). Give the log page's sidebar thumbnail
 * the same name so the browser morphs one into the other.
 */
export const carTransitionName = (carId: string) => `garage-car-${carId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

const KEY = 'garage-scene:out';

/** Called by the scene when a car drives out. */
export function rememberEnteredCar(carId: string) {
  try {
    sessionStorage.setItem(KEY, carId);
  } catch {
    /* storage blocked: the car just won't reverse in */
  }
}

/**
 * The car that last drove out of the garage in this tab, if any. Read-only;
 * the scene clears it once that car has reversed back in (onReturned).
 */
export function returningCar(): string | undefined {
  try {
    return sessionStorage.getItem(KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function clearReturningCar() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
