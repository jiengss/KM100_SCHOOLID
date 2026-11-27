/**
 * Google Drive URL Resolver & Image Ingestion Helper
 * Converts any Google Drive sharing link, open link, or file ID into direct image streams
 */

// Detect if a string is a Google Drive URL
export function isGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return (
    url.includes('drive.google.com') ||
    url.includes('docs.google.com') ||
    url.includes('googleusercontent.com')
  );
}

// Extract the Google Drive file ID from all common URL variants
export function extractGoogleDriveFileId(url) {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();

  // Pattern 1: /file/d/FILE_ID/view or /file/d/FILE_ID
  const fileDMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch) return fileDMatch[1];

  // Pattern 2: id=FILE_ID or ?id=FILE_ID
  const idParamMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch) return idParamMatch[1];

  // Pattern 3: /d/FILE_ID/
  const dMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch) return dMatch[1];

  // Pattern 4: googleusercontent.com/d/FILE_ID
  const ucMatch = cleanUrl.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (ucMatch) return ucMatch[1];

  // Pattern 5: Raw File ID (typically 25 to 45 alphanumeric characters with _ and -)
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  return null;
}

// Clean offline fallback SVG avatar (neutral slate-100 background with slate-400 silhouette)
export const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' rx='24' fill='%23f1f5f9'/%3E%3Cpath d='M64 20a24 24 0 100 48 24 24 0 000-48zM28 110a36 36 0 0172 0H28z' fill='%2394a3b8'/%3E%3C/svg%3E";

/**
 * Returns a robust, safe photo URL for any student, employee, or visitor.
 * Resolves Google Drive links, preserves base64 and direct URLs, and falls back to DEFAULT_AVATAR.
 */
export function getSafePhotoUrl(url, size = 600) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_AVATAR;
  }
  const clean = url.trim();
  if (isGoogleDriveUrl(clean)) {
    return convertToGoogleDriveDirectImageUrl(clean, size);
  }
  return clean;
}

/**
 * Reliable onError handler for <img> elements:
 * Prevents broken image icons if a photo URL fails to load, rate-limits, or is blocked.
 */
export function handleImageError(e) {
  if (!e || !e.target || e.target.dataset.fallbackApplied === 'true') return;
  e.target.dataset.fallbackApplied = 'true';
  e.target.src = DEFAULT_AVATAR;
}

// Convert any Google Drive URL to a direct high-resolution image thumbnail URL
export function convertToGoogleDriveDirectImageUrl(url, size = 1000) {
  if (!url || typeof url !== 'string') return url;
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;

  // Google Thumbnail CDN provides high-resolution, CORS-friendly direct image rendering
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

// Alternate direct content link
export function getGoogleDriveDownloadUrl(url) {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Fetches an image from a Google Drive URL or any direct image URL and returns a base64 Data URL
 */
export async function fetchGoogleDriveImageAsBase64(url) {
  if (!url) throw new Error("No URL provided");
  const directUrl = isGoogleDriveUrl(url) ? convertToGoogleDriveDirectImageUrl(url, 1200) : url;

  try {
    const response = await fetch(directUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: HTTP ${response.status}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    // Fallback: If direct fetch had CORS, return the thumbnail URL directly
    console.warn("Direct blob fetch warning for Google Drive URL, returning direct CDN link:", err);
    return directUrl;
  }
}
