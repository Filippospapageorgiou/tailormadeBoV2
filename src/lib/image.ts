import { dev } from '$app/environment';

/**
 * Generates an optimised image src using Vercel's Image Optimization API.
 * In development, returns the original URL unchanged.
 * In production, routes through /_vercel/image which resizes + converts to WebP/AVIF for free.
 *
 * @param src    - Original image URL (e.g. from Supabase Storage)
 * @param width  - Desired display width in px (default: 400 for grid cards)
 * @param quality - Image quality 1-100 (default: 75)
 */
export function optimizeImage(src: string | null, width = 640, quality = 90): string | null {
	if (!src) return null;
	if (dev) return src; // Don't transform in local dev

	return `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
