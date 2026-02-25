import type { ThumbnailResult, ThumbnailService } from './thumbnail-service';

export class NoOpThumbnailService implements ThumbnailService {
  canGenerate(_mimeType: string): boolean {
    return false;
  }

  async generate(
    _fileBuffer: Buffer,
    _mimeType: string,
  ): Promise<ThumbnailResult | null> {
    return null;
  }
}
