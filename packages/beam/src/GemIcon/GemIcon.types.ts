/**
 * GemIcon — semantic asset component. The ONLY way product code shows a
 * loyalty gem. Nobody imports image paths directly (same reason nobody
 * writes hex): the registry is auditable, swappable, and syncable.
 */
export type GemName =
  | 'member' | 'amethyst' | 'topaz' | 'aquamarine' | 'opal' | 'emerald'
  | 'ruby' | 'sapphire' | 'diamond' | 'vip';

export interface GemIconProps {
  gem: GemName;
  /** Pixel size of the gem art */
  size?: number;
  /** Dark circular plate behind the crystal (light-mode legibility) */
  plate?: boolean;
  alt?: string;
}
