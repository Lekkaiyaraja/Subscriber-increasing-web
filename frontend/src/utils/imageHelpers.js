import { API } from '../config.js';

export const PLACEHOLDER_IMAGE = '/assets/player-placeholder.svg';

// Optional override: set VITE_FALLBACK_IMAGE to a Cloudinary-hosted default image
// in production if you prefer a hosted fallback. Otherwise local placeholder is used.
const envFallback = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FALLBACK_IMAGE
  ? String(import.meta.env.VITE_FALLBACK_IMAGE).trim()
  : '';

export const FALLBACK_IMAGE = (envFallback && (envFallback.startsWith('http://') || envFallback.startsWith('https://')))
  ? envFallback
  : PLACEHOLDER_IMAGE;

export const buildImageUrl = (photo) => {
  if (!photo) return FALLBACK_IMAGE;
  if (typeof photo !== 'string') return FALLBACK_IMAGE;

  const trimmed = photo.trim();

  // Absolute URLs (Cloudinary or other CDN) - use as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Relative paths (including uploads/) should be resolved through the API backend
  // so we always attempt to load from the backend first.
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API}${normalized}`;
};

export const handleImageError = (event) => {
  try {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_IMAGE;
  } catch (e) {
    // swallow errors silently - fallback cannot be applied
  }
};
