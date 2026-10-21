/**
 * The lid's transform for an opening angle (0 = upright, 90 = closed), seen
 * from a little above. The perspective lives in the lid's own transform, with
 * its vanishing point shifted above the hinge (translateY ± 110% of the lid's
 * height), so the parent stays flat and Safari keeps stacking by z-index.
 */
export const lidAngle = (closed: number) => `translateY(-110%) perspective(1100px) translateY(110%) rotateX(-${closed}deg)`;
