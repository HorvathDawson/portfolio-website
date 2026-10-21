import React from 'react';
import './CampScene.css';

const TENT_PHOTO = '/assets/about/tent.webp';

/** Moves the tent photo's blues to the site's purples. */
const TENT_TINT = '0.55 0.1 0.45 0 0  0.2 0.3 0.15 0 0  0.2 0.2 0.9 0 0  0 0 0 1 0';

/** The tent photo's silhouette (traced, in photo pixels), for keeping the lamp light inside it. */
const TENT_CONTOUR =
  'M722.0,613.6C720.0,612.3 719.2,612.1 714.7,611.8C707.4,611.4 688.7,607.3 672.5,602.7C667.1,601.2 659.7,599.7 655.2,599.3C651.3,598.9 645.5,597.5 641.7,596.0C640.3,595.5 636.5,594.5 633.2,593.8C626.1,592.3 625.0,592.0 620.8,590.3C615.2,588.1 612.3,588.7 607.5,593.2C603.3,597.2 598.3,601.3 596.5,602.3C594.7,603.2 591.5,603.2 590.4,602.4C590.0,602.0 589.1,600.7 588.3,599.4C586.8,596.7 585.0,595.7 580.5,595.2C578.7,595.1 574.5,594.3 571.2,593.5C568.0,592.8 563.7,591.9 561.7,591.6C559.8,591.3 554.9,590.1 550.7,588.9C546.6,587.8 542.2,586.6 540.9,586.2C537.1,585.2 528.8,585.8 526.2,587.3C523.5,588.8 521.2,588.8 518.9,587.3L517.1,586.1L515.9,587.4C515.2,588.1 513.7,590.2 512.5,592.0C508.1,598.5 504.3,601.2 493.9,605.1C484.3,608.7 480.5,609.5 471.5,609.8C464.6,610.1 463.3,610.0 460.0,609.1C457.9,608.5 454.3,607.7 452.0,607.2C444.9,605.8 417.4,597.8 404.5,593.3C384.8,586.5 385.5,586.6 380.1,589.2C374.2,592.1 370.6,591.6 364.3,587.3C362.5,586.1 360.3,584.9 359.4,584.8C358.5,584.6 346.5,584.3 332.8,584.0C319.0,583.7 305.9,583.3 303.7,583.0C301.5,582.8 294.8,582.2 288.7,581.8C282.7,581.3 276.4,580.8 274.8,580.5C273.1,580.2 269.6,580.0 267.0,580.0C264.4,580.0 256.9,579.7 250.2,579.2C243.7,578.8 234.7,578.5 230.2,578.5C215.1,578.5 207.9,577.3 201.6,573.7C200.5,573.0 194.3,570.9 188.0,569.0C181.6,567.1 174.4,564.7 172.1,563.7C167.7,561.9 160.1,559.6 155.0,558.5C153.5,558.2 149.5,557.1 146.3,556.0C143.0,554.9 140.1,554.0 139.9,554.0C139.6,554.0 137.3,553.1 134.8,552.1C126.8,548.7 124.0,548.0 118.8,548.0C114.0,548.0 108.5,547.2 102.0,545.5C98.3,544.5 97.4,544.1 90.2,541.1C87.8,540.0 85.3,539.4 81.8,539.0C73.4,538.1 65.8,537.0 64.4,536.4C62.7,535.8 61.5,533.7 61.5,531.6C61.5,530.0 63.7,526.5 68.2,520.8C69.7,518.9 72.8,513.8 75.0,509.5C77.3,505.3 80.6,499.3 82.4,496.4C84.3,493.4 86.5,489.6 87.5,487.9C88.5,486.2 91.9,481.2 95.0,476.8C98.2,472.4 104.2,463.2 108.2,456.5C112.3,449.8 117.5,441.2 119.9,437.5C122.2,433.8 125.1,429.3 126.2,427.5C127.2,425.7 130.4,420.9 133.2,416.9C136.0,412.8 140.4,406.3 143.0,402.5C157.0,382.0 178.6,357.7 199.7,338.6C203.3,335.4 210.1,329.2 214.9,324.9C219.6,320.6 227.2,314.3 231.6,310.9C250.9,296.4 252.5,295.2 261.5,289.1C271.0,282.6 291.8,271.2 302.2,266.8C308.6,264.1 332.2,252.3 340.1,247.9C346.7,244.2 350.8,242.4 377.2,231.7C384.5,228.7 385.7,228.4 390.2,228.0C393.4,227.7 396.8,227.1 399.2,226.3C405.9,224.0 414.7,222.4 420.5,222.4C426.4,222.3 428.0,222.7 434.9,226.2C441.6,229.5 443.2,229.9 456.5,231.0C460.2,231.3 467.1,232.4 471.8,233.3C482.8,235.6 486.5,236.3 493.5,237.0C501.4,237.8 507.0,238.7 515.5,240.8C542.9,247.4 556.7,252.4 579.0,263.5C595.4,271.7 609.2,279.8 618.3,286.5C633.9,298.1 662.6,325.9 679.3,345.8C703.5,374.5 708.2,380.8 723.9,406.1C738.3,429.2 745.7,443.6 761.4,479.2C768.6,495.7 771.5,502.8 776.9,517.3C782.7,532.8 787.1,543.8 788.7,547.0C790.2,549.9 793.2,558.6 795.5,566.8C799.0,578.9 797.9,590.3 792.7,596.0C790.4,598.5 787.2,599.8 780.2,601.0C772.7,602.3 772.2,602.2 769.7,600.9C768.2,600.0 766.6,599.7 762.7,599.5C757.9,599.3 757.5,599.2 755.0,597.4C751.8,595.2 747.7,594.1 746.0,595.0C745.5,595.3 744.4,596.5 743.7,597.6C740.8,602.2 732.6,612.8 731.2,613.7C730.4,614.3 728.6,614.8 727.0,614.9C724.6,615.1 724.0,614.9 722.0,613.6Z ';

/**
 * A seated fisher in silhouette, facing the page edge, in local units with the
 * ground at y = 0 and the seat rock under the hips. Each shape is drawn twice:
 * a light rim first, then the dark body over it, so the figure reads as one
 * silhouette with a thin outline.
 */
const FISHER_SHAPES = [
  // Head and cap with its peak forward
  'M-9 -122 C-9 -134 10 -135 10 -122 C10 -114 5 -109 0 -109 C-5 -109 -9 -114 -9 -122 Z',
  'M-11 -124 C-11 -137 11 -138 12 -126 L23 -124 C24 -122 23 -121 21 -121 L-11 -121 Z',
  // Neck and jacket, leaning a little forward
  'M-4 -112 L5 -112 L6 -103 L-4 -103 Z',
  'M-14 -100 C-10 -106 8 -107 13 -100 C19 -88 18 -66 14 -46 L-12 -44 C-18 -62 -19 -86 -14 -100 Z',
  // Thigh to the knee, shin down, boot
  'M-10 -56 L30 -62 C40 -63 43 -50 34 -46 L-8 -40 Z',
  'M27 -58 C33 -61 41 -58 41 -51 L43 -10 L31 -10 L28 -50 Z',
  'M29 -12 L44 -12 C51 -12 54 -6 54 0 L28 0 Z',
];
/** Arms as thick strokes: shoulder to elbow to the hands on the rod. */
const FISHER_ARM = 'M2 -97 L14 -70 L35 -80';

const Fisher: React.FC = () => (
  <g className="camp-fisher" transform="translate(640 272)">
    {/* Rock seat, behind the legs */}
    <path className="camp-line camp-solid" d="M-46 0 C-46 -28 -26 -46 -2 -46 C20 -46 30 -30 30 0 Z" />
    <g className="camp-rim">
      {FISHER_SHAPES.map((d) => <path key={d} d={d} />)}
      <path d={FISHER_ARM} fill="none" style={{ strokeWidth: 12.5 }} />
    </g>
    <g className="camp-body">
      {FISHER_SHAPES.map((d) => <path key={d} d={d} />)}
      <path d={FISHER_ARM} fill="none" style={{ strokeWidth: 9 }} />
    </g>
    {/* Rod (thicker at the butt), reel, and the tip the line hangs from */}
    <path className="camp-line" d="M18 -66 Q108 -150 196 -228" strokeWidth={1.6} />
    <path className="camp-line" d="M18 -66 L46 -90" strokeWidth={3.4} />
    <circle className="camp-line camp-solid" cx="28" cy="-70" r="4" strokeWidth={1.4} />
    <circle className="camp-rod-tip" cx="196" cy="-228" r="0.5" />
  </g>
);

/**
 * The tent, campfire and a fisher, as line art like the project cards. The
 * fisher's line is drawn separately (FishingLine) since it runs down the page.
 */
export const CampScene: React.FC = () => (
  <svg className="camp-scene" viewBox="0 0 850 290" aria-hidden="true" focusable="false">
    <defs>
      {/* Photo colours shifted to the site's purples, brighter where the fabric is light. */}
      <filter id="camp-tent-tint" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values={TENT_TINT} />
      </filter>
      <filter id="camp-tent-bloom" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values={TENT_TINT} />
        <feGaussianBlur stdDeviation="28" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.9" />
        </feComponentTransfer>
      </filter>
      <clipPath id="camp-tent-shape">
        <path d={TENT_CONTOUR} />
      </clipPath>
      <radialGradient id="camp-lamp">
        <stop offset="0" stopColor="#f3e6ff" stopOpacity="0.75" />
        <stop offset="0.45" stopColor="#c69bff" stopOpacity="0.35" />
        <stop offset="1" stopColor="#9d6bff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="camp-glow">
        <stop offset="0" stopColor="#ff8c00" stopOpacity="0.45" />
        <stop offset="0.45" stopColor="#ff5a00" stopOpacity="0.15" />
        <stop offset="1" stopColor="#ff3c00" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="camp-flame" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#ff5a1f" />
        <stop offset="0.6" stopColor="#ff9b3d" />
        <stop offset="1" stopColor="#ffd56b" />
      </linearGradient>
    </defs>

    <circle className="camp-glow" cx="80" cy="228" r="110" fill="url(#camp-glow)" />

    {/* Ground */}
    <path className="camp-line camp-faint" d="M0 272 L160 272 M176 273 L512 273 M580 272 L710 272" />

    {/* The original tent photo, lit from inside: a purple bloom behind it,
        the photo tinted purple, a lamp's glow inside its shape, and its
        traced outline on top. Drawn in the photo's own pixels. */}
    <g className="camp-tent" transform="translate(150.4 8) scale(0.44)">
      <image className="camp-tent-bloom" href={TENT_PHOTO} width="872" height="872" filter="url(#camp-tent-bloom)" />
      <image href={TENT_PHOTO} width="872" height="872" filter="url(#camp-tent-tint)" opacity="0.9" />
      <g clipPath="url(#camp-tent-shape)">
        <ellipse className="camp-tent-lamp" cx="470" cy="520" rx="260" ry="190" fill="url(#camp-lamp)" />
      </g>
      <image href="/assets/about/tent-outline.svg" x="56" y="216" width="747" height="404" />
    </g>

    {/* Campfire: crossed logs, flames, a ring of stones in front */}
    <g className="camp-fire">
      <g transform="translate(80 248) rotate(-20)">
        <rect className="camp-line camp-solid" x="-56" y="-9" width="112" height="18" rx="9" />
        <ellipse className="camp-line" cx="49" cy="0" rx="3.5" ry="7" />
      </g>
      <g transform="translate(80 248) rotate(20)">
        <rect className="camp-line camp-solid" x="-56" y="-9" width="112" height="18" rx="9" />
        <ellipse className="camp-line" cx="-49" cy="0" rx="3.5" ry="7" />
      </g>
      <path
        className="camp-flame camp-flame-outer"
        d="M80 242 C50 240 46 206 62 186 C66 201 72 203 75 197 C70 176 80 151 98 136 C94 159 112 173 110 201 C116 197 118 189 116 181 C128 198 125 238 80 242 Z"
      />
      <path
        className="camp-flame camp-flame-inner"
        d="M80 240 C66 238 63 220 72 207 C74 215 78 215 80 209 C80 197 86 187 94 181 C92 197 102 205 98 223 C96 233 90 240 80 240 Z"
      />
      <circle className="camp-spark camp-spark-1" cx="74" cy="150" r="1.8" />
      <circle className="camp-spark camp-spark-2" cx="92" cy="140" r="1.4" />
      <circle className="camp-spark camp-spark-3" cx="84" cy="160" r="1.6" />
      {[
        [32, 263, 15, 9],
        [57, 269, 16, 8.5],
        [86, 271, 15, 8],
        [114, 268, 16, 9],
        [135, 262, 12, 8],
      ].map(([cx, cy, rx, ry]) => (
        <ellipse key={cx} className="camp-line camp-solid" cx={cx} cy={cy} rx={rx} ry={ry} />
      ))}
    </g>

    <Fisher />
  </svg>
);
