import type { ThumbnailResult, ThumbnailService } from './thumbnail-service';

/**
 * Composite thumbnail service that delegates to multiple services in order.
 * The first service that reports `canGenerate` for a given MIME type wins.
 *
 * This allows chaining SharpThumbnailService (images) with future services
 * (e.g., PDF, video) without modifying consumer code.
 */
export class CompositeThumbnailService implements ThumbnailService {
  private services: ThumbnailService[];

  constructor(services: ThumbnailService[]) {
    this.services = services;
  }

  canGenerate(mimeType: string): boolean {
    return this.services.some((service) => service.canGenerate(mimeType));
  }

  async generate(
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<ThumbnailResult | null> {
    for (const service of this.services) {
      if (service.canGenerate(mimeType)) {
        return service.generate(fileBuffer, mimeType);
      }
    }

    return null;
  }
}
