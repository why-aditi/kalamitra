'use client';

import Image from 'next/image';
import { useState } from 'react';

/**
 * next/image with a graceful fallback. Backend image URLs can 404 when a GridFS
 * object is missing, which used to leave a broken-image glyph in the grid.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  className = '',
}: {
  src: string | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = !src || failed ? '/placeholder.svg' : src;

  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
