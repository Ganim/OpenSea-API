import sharp from 'sharp';

import type { ThumbnailResult, ThumbnailService } from './thumbnail-service';

const THUMBNAIL_MAX_WIDTH = 300;
const THUMBNAIL_MAX_HEIGHT = 300;
const THUMBNAIL_JPEG_QUALITY = 80;

const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/tiff',
];

export class SharpThumbnailService implements ThumbnailService {
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

    const thumbnail = await sharp(fileBuffer)
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
  }
}
