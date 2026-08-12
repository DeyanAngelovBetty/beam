/**
 * The Betty four-point sparkle — brand geometry, ONE source of truth.
 *
 * The SHAPE is brand-constant: never a seed, never in Figma, never exported. What IS tunable is
 * how much of each mask tile the glyph fills (`sizeRatio`) — decoupled from the tile PITCH
 * (spacing), because a CSS mask's repeat period equals its `mask-size`, so glyph-vs-tile ratio
 * has to live INSIDE the image, not in the size. Hence a builder: the theme materializes
 * `--beam-star-mask` from a product's `sizeRatio` seed; the Theme Lab regenerates it live on the
 * Size slider; the Lab's star chip renders its swatch through the same glyph. All from here.
 */

// Concave sparkle in a native 100-unit box (0..100 on both axes), centred on (50,50).
export const STAR_PATH =
  'M50 0 C55 35 65 45 100 50 C65 55 55 65 50 100 C45 65 35 55 0 50 C35 45 45 35 50 0 Z';

/**
 * A `url("data:image/svg+xml,…")` mask value: the sparkle scaled to `ratio` of a 100×100 tile
 * and centred, so `ratio` is the glyph/tile fraction independent of `mask-size`. ratio 0.4
 * reproduces the original hardcoded padding (glyph spanned 0.3..0.7 of the tile). `%23` is `#`.
 */
export function starMaskUri(ratio: number): string {
  const off = 50 * (1 - ratio); // centre the scaled glyph in the tile
  return (
    "url(\"data:image/svg+xml," +
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
    `<path transform='translate(${off} ${off}) scale(${ratio})' d='${STAR_PATH}' fill='%23000'/>` +
    "</svg>\")"
  );
}
