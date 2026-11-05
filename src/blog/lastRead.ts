/* The last sheet read per car (this browser only), for "Continue · sheet N". */

const key = (car: string) => `garage:last-read:${car}`;

export function rememberSheet(car: string, slug: string) {
  try {
    localStorage.setItem(key(car), slug);
  } catch {
    /* storage blocked: no "Continue" button */
  }
}

export function lastReadSlug(car: string): string | undefined {
  try {
    return localStorage.getItem(key(car)) ?? undefined;
  } catch {
    return undefined;
  }
}
