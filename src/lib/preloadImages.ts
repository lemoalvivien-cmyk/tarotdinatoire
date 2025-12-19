/**
 * Image preloading utilities with caching and error handling
 */

const preloadedImages = new Map<string, Promise<void>>();
const loadedImages = new Set<string>();
const failedImages = new Set<string>();

/**
 * Preload a single image with decode() for smoother rendering
 */
export function preloadImage(url: string): Promise<void> {
  // Already loaded successfully
  if (loadedImages.has(url)) {
    return Promise.resolve();
  }

  // Known to fail, don't retry
  if (failedImages.has(url)) {
    return Promise.reject(new Error(`Image previously failed: ${url}`));
  }

  // Already loading
  if (preloadedImages.has(url)) {
    return preloadedImages.get(url)!;
  }

  // Start loading
  const promise = new Promise<void>((resolve, reject) => {
    const img = new Image();

    img.onload = async () => {
      try {
        // Use decode() for smoother rendering if available
        if ('decode' in img && typeof img.decode === 'function') {
          await img.decode();
        }
        loadedImages.add(url);
        resolve();
      } catch {
        // decode() failed but image is still usable
        loadedImages.add(url);
        resolve();
      }
    };

    img.onerror = () => {
      preloadedImages.delete(url);
      failedImages.add(url);
      reject(new Error(`Failed to load image: ${url}`));
    };

    img.src = url;
  });

  preloadedImages.set(url, promise);
  return promise;
}

/**
 * Preload multiple images in parallel with optional concurrency limit
 * Returns array of results { url, success, error? }
 */
export async function preloadImages(
  urls: string[],
  options: { concurrency?: number; onProgress?: (loaded: number, total: number) => void } = {}
): Promise<{ url: string; success: boolean; error?: Error }[]> {
  const { concurrency = 6, onProgress } = options;
  const results: { url: string; success: boolean; error?: Error }[] = [];
  let loaded = 0;

  // Filter out empty/null URLs and duplicates
  const validUrls = [...new Set(urls.filter(Boolean))];
  const total = validUrls.length;

  if (total === 0) {
    return [];
  }

  // Process in batches for controlled concurrency
  const batches: string[][] = [];
  for (let i = 0; i < validUrls.length; i += concurrency) {
    batches.push(validUrls.slice(i, i + concurrency));
  }

  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map(async (url) => {
        await preloadImage(url);
        return url;
      })
    );

    for (let i = 0; i < batchResults.length; i++) {
      const result = batchResults[i];
      const url = batch[i];
      
      if (result.status === 'fulfilled') {
        results.push({ url, success: true });
      } else {
        results.push({ url, success: false, error: result.reason });
      }
      
      loaded++;
      onProgress?.(loaded, total);
    }
  }

  return results;
}

/**
 * Check if an image is already loaded/cached
 */
export function isImageLoaded(url: string): boolean {
  return loadedImages.has(url);
}

/**
 * Check if an image failed to load
 */
export function hasImageFailed(url: string): boolean {
  return failedImages.has(url);
}

/**
 * Clear all preload caches (for testing/debugging)
 */
export function clearPreloadCache(): void {
  preloadedImages.clear();
  loadedImages.clear();
  failedImages.clear();
}

/**
 * Get preload statistics
 */
export function getPreloadStats(): { loaded: number; failed: number; pending: number } {
  return {
    loaded: loadedImages.size,
    failed: failedImages.size,
    pending: preloadedImages.size - loadedImages.size,
  };
}
