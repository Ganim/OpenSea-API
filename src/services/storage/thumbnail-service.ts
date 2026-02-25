export interface ThumbnailResult {
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: string;
}

export interface ThumbnailService {
  generate(
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<ThumbnailResult | null>;
  canGenerate(mimeType: string): boolean;
}
