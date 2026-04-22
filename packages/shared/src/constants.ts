import { Folder } from "./types.js";

export const ALLOWED_MIME_TYPES: Record<Folder, string[]> = {
  [Folder.POSTES]: ["application/pdf"],
  [Folder.CAMARAS]: ["application/pdf"],
  [Folder.FACHADAS]: ["application/pdf"],
  [Folder.FOTOS]: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/svg+xml",
  ],
  [Folder.PLANOS]: [
    "application/pdf",
    "application/vnd.google-earth.kmz",
    "application/octet-stream",
    "application/zip",
    "application/x-zip-compressed",
  ],
  [Folder.ARQUETAS]: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/svg+xml",
  ],
};

export function isValidMimeType(folder: Folder, mimeType: string, filename?: string): boolean {
  if (folder === Folder.FOTOS || folder === Folder.ARQUETAS) {
    return mimeType.startsWith("image/");
  }

  // KMZ files: browsers often report empty string or generic MIME types
  if (folder === Folder.PLANOS && filename?.toLowerCase().endsWith(".kmz")) {
    return true;
  }

  const allowed = ALLOWED_MIME_TYPES[folder];
  return allowed.includes(mimeType);
}
