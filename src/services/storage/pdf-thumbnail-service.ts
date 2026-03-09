import sharp from 'sharp';

import type { ThumbnailResult, ThumbnailService } from './thumbnail-service';

const THUMBNAIL_MAX_WIDTH = 300;
const THUMBNAIL_MAX_HEIGHT = 300;
const THUMBNAIL_JPEG_QUALITY = 80;

const SUPPORTED_MIME_TYPES = ['application/pdf'];

/**
 * Generates thumbnails from the first page of PDF files using sharp (libvips + poppler).
 *
 * Requires poppler to be installed on the system for libvips PDF support.
 * On Debian/Ubuntu: apt-get install libpoppler-glib-dev
 * On Alpine: apk add poppler-utils
 *
 * If poppler is not available, generate() returns null gracefully.
 */
export class PdfThumbnailService implements ThumbnailService {
  canGenerate(mimeType: string): boolean {
    return SUPPORTED_MIME_TYPES.includes(mimeType);
  }

  async generate(
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<ThumbnailResult | null> {
    if (!this.canGenerate(mimeType)) {
      return null;
    }

    try {
      const thumbnail = await sharp(fileBuffer, {
        density: 150, // DPI for PDF rendering
        pages: 1, // Only first page
      })
        .resize(THUMBNAIL_MAX_WIDTH, THUMBNAIL_MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: THUMBNAIL_JPEG_QUALITY })
        .toBuffer({ resolveWithObject: true });

      return {
        buffer: thumbnail.data,
        width: thumbnail.info.width,
        height: thumbnail.info.height,
        mimeType: 'image/jpeg',
      };
    } catch {
      // poppler not available or corrupted PDF — fail gracefully
      return null;
    }
  }
}
