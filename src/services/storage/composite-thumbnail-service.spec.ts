import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CompositeThumbnailService } from './composite-thumbnail-service';
import type { ThumbnailResult, ThumbnailService } from './thumbnail-service';

function makeFakeService(
  supportedTypes: string[],
  result?: ThumbnailResult,
): ThumbnailService {
  return {
    canGenerate: vi.fn((mimeType: string) => supportedTypes.includes(mimeType)),
    generate: vi.fn(async () => result ?? null),
  };
}

const IMAGE_RESULT: ThumbnailResult = {
  buffer: Buffer.from('image-thumb'),
  width: 300,
  height: 200,
  mimeType: 'image/jpeg',
};

const PDF_RESULT: ThumbnailResult = {
  buffer: Buffer.from('pdf-thumb'),
  width: 300,
  height: 424,
  mimeType: 'image/jpeg',
};

describe('CompositeThumbnailService', () => {
  let imageService: ThumbnailService;
  let pdfService: ThumbnailService;
  let sut: CompositeThumbnailService;

  beforeEach(() => {
    imageService = makeFakeService(
      ['image/jpeg', 'image/png', 'image/webp'],
      IMAGE_RESULT,
    );
    pdfService = makeFakeService(['application/pdf'], PDF_RESULT);
    sut = new CompositeThumbnailService([imageService, pdfService]);
  });

  describe('canGenerate', () => {
    it('should return true when the first service supports the type', () => {
      expect(sut.canGenerate('image/jpeg')).toBe(true);
      expect(imageService.canGenerate).toHaveBeenCalledWith('image/jpeg');
    });

    it('should return true when a later service supports the type', () => {
      expect(sut.canGenerate('application/pdf')).toBe(true);
    });

    it('should return false when no service supports the type', () => {
      expect(sut.canGenerate('video/mp4')).toBe(false);
    });

    it('should return false when there are no services', () => {
      const empty = new CompositeThumbnailService([]);
      expect(empty.canGenerate('image/jpeg')).toBe(false);
    });
  });

  describe('generate', () => {
    it('should delegate to the first matching service', async () => {
      const buffer = Buffer.from('test-image');
      const result = await sut.generate(buffer, 'image/jpeg');

      expect(result).toEqual(IMAGE_RESULT);
      expect(imageService.generate).toHaveBeenCalledWith(buffer, 'image/jpeg');
      expect(pdfService.generate).not.toHaveBeenCalled();
    });

    it('should delegate to a later service if earlier ones do not match', async () => {
      const buffer = Buffer.from('test-pdf');
      const result = await sut.generate(buffer, 'application/pdf');

      expect(result).toEqual(PDF_RESULT);
      expect(pdfService.generate).toHaveBeenCalledWith(
        buffer,
        'application/pdf',
      );
      expect(imageService.generate).not.toHaveBeenCalled();
    });

    it('should return null when no service matches', async () => {
      const buffer = Buffer.from('test-video');
      const result = await sut.generate(buffer, 'video/mp4');

      expect(result).toBeNull();
      expect(imageService.generate).not.toHaveBeenCalled();
      expect(pdfService.generate).not.toHaveBeenCalled();
    });

    it('should return null with an empty services list', async () => {
      const empty = new CompositeThumbnailService([]);
      const result = await empty.generate(Buffer.from('data'), 'image/png');

      expect(result).toBeNull();
    });

    it('should only call the first matching service even if multiple match', async () => {
      const secondImageService = makeFakeService(
        ['image/jpeg'],
        PDF_RESULT, // different result to distinguish
      );
      const composite = new CompositeThumbnailService([
        imageService,
        secondImageService,
      ]);

      const buffer = Buffer.from('test');
      const result = await composite.generate(buffer, 'image/jpeg');

      expect(result).toEqual(IMAGE_RESULT);
      expect(imageService.generate).toHaveBeenCalled();
      expect(secondImageService.generate).not.toHaveBeenCalled();
    });
  });
});
