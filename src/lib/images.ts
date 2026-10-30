import type { ImageMetadata } from 'astro';

/**
 * Character art and photos live in `src/assets/images/` under these names (any of
 * .png, .jpg, .webp, .avif). Until a file is added, components show a placeholder.
 */
export type ImageName = 'emblem' | 'gilbert-guide' | 'gilbert-thumbs-up' | 'suzana-and-gilbert';

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
});

const byName = new Map(
  Object.entries(files).map(([path, module]) => [path.replace(/^.*\/|\.\w+$/g, ''), module.default]),
);

export function getImage(name: ImageName): ImageMetadata | undefined {
  return byName.get(name);
}
