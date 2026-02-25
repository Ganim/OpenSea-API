import { NoOpThumbnailService } from '@/services/storage/no-op-thumbnail-service';
import { SharpThumbnailService } from '@/services/storage/sharp-thumbnail-service';
import { describe, expect, it } from 'vitest';

describe('ThumbnailService', () => {
  describe('SharpThumbnailService', () => {
    const sut = new SharpThumbnailService();

    it('should report canGenerate true for supported image types', () => {
      expect(sut.canGenerate('image/jpeg')).toBe(true);
      expect(sut.canGenerate('image/png')).toBe(true);
      expect(sut.canGenerate('image/webp')).toBe(true);
      expect(sut.canGenerate('image/gif')).toBe(true);
      expect(sut.canGenerate('image/tiff')).toBe(true);
    });

    it('should report canGenerate false for non-image mime types', () => {
      expect(sut.canGenerate('application/pdf')).toBe(false);
      expect(sut.canGenerate('text/plain')).toBe(false);
      expect(sut.canGenerate('application/json')).toBe(false);
      expect(sut.canGenerate('video/mp4')).toBe(false);
    });

    it('should report canGenerate false for unsupported image types', () => {
      expect(sut.canGenerate('image/svg+xml')).toBe(false);
      expect(sut.canGenerate('image/bmp')).toBe(false);
    });

    it('should return null for unsupported mime type', async () => {
      const buffer = Buffer.from('not an image');
      const result = await sut.generate(buffer, 'application/pdf');
      expect(result).toBeNull();
    });

    it('should generate thumbnail for JPEG image', async () => {
      // Create a minimal valid JPEG-compatible image using sharp
      const { default: sharp } = await import('sharp');
      const testImage = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await sut.generate(testImage, 'image/jpeg');

      expect(result).not.toBeNull();
      expect(result!.buffer).toBeInstanceOf(Buffer);
      expect(result!.buffer.length).toBeGreaterThan(0);
      expect(result!.width).toBeLessThanOrEqual(300);
      expect(result!.height).toBeLessThanOrEqual(300);
      expect(result!.mimeType).toBe('image/jpeg');
    });

    it('should generate thumbnail for PNG image', async () => {
      const { default: sharp } = await import('sharp');
      const testImage = await sharp({
        create: {
          width: 1024,
          height: 768,
          channels: 4,
          background: { r: 0, g: 128, b: 255, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      const result = await sut.generate(testImage, 'image/png');

      expect(result).not.toBeNull();
      expect(result!.buffer).toBeInstanceOf(Buffer);
      expect(result!.buffer.length).toBeGreaterThan(0);
      expect(result!.width).toBeLessThanOrEqual(300);
      expect(result!.height).toBeLessThanOrEqual(300);
      // Output is always JPEG regardless of input format
      expect(result!.mimeType).toBe('image/jpeg');
    });

    it('should not enlarge images smaller than thumbnail size', async () => {
      const { default: sharp } = await import('sharp');
      const smallImage = await sharp({
        create: {
          width: 100,
          height: 80,
          channels: 3,
          background: { r: 0, g: 255, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await sut.generate(smallImage, 'image/jpeg');

      expect(result).not.toBeNull();
      // withoutEnlargement: true means small images stay their original size
      expect(result!.width).toBeLessThanOrEqual(100);
      expect(result!.height).toBeLessThanOrEqual(80);
    });

    it('should maintain aspect ratio when resizing', async () => {
      const { default: sharp } = await import('sharp');
      // 1000x500 image => should resize to 300x150 (2:1 ratio)
      const wideImage = await sharp({
        create: {
          width: 1000,
          height: 500,
          channels: 3,
          background: { r: 128, g: 128, b: 128 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await sut.generate(wideImage, 'image/jpeg');

      expect(result).not.toBeNull();
      expect(result!.width).toBe(300);
      expect(result!.height).toBe(150);
    });
  });

  describe('NoOpThumbnailService', () => {
    const sut = new NoOpThumbnailService();

    it('should always return false for canGenerate', () => {
      expect(sut.canGenerate('image/jpeg')).toBe(false);
      expect(sut.canGenerate('image/png')).toBe(false);
      expect(sut.canGenerate('application/pdf')).toBe(false);
    });

    it('should always return null for generate', async () => {
      const buffer = Buffer.from('anything');
      const result = await sut.generate(buffer, 'image/jpeg');
      expect(result).toBeNull();
    });
  });
});
