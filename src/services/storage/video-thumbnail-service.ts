import { execFile } from 'child_process';
import { randomUUID } from 'crypto';
import { readFile, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import sharp from 'sharp';

import type { ThumbnailResult, ThumbnailService } from './thumbnail-service';

const THUMBNAIL_MAX_WIDTH = 300;
const THUMBNAIL_MAX_HEIGHT = 300;
const THUMBNAIL_JPEG_QUALITY = 80;

const SUPPORTED_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
];

/**
 * Extracts a thumbnail from the first frame of a video file using ffmpeg.
 *
 * Requires ffmpeg to be installed and available in PATH.
 * On Debian/Ubuntu: apt-get install ffmpeg
 * On Alpine: apk add ffmpeg
 *
 * If ffmpeg is not available, generate() returns null gracefully.
 */
export class VideoThumbnailService implements ThumbnailService {
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

    const id = randomUUID();
    const inputPath = join(tmpdir(), `opensea-thumb-in-${id}`);
    const outputPath = join(tmpdir(), `opensea-thumb-out-${id}.jpg`);

    try {
      // Write video buffer to temp file (ffmpeg needs file input)
      await writeFile(inputPath, fileBuffer);

      // Extract first frame at 1 second (or 0 if video is shorter)
      await this.runFfmpeg(inputPath, outputPath);

      // Read the extracted frame and resize with sharp
      const frameBuffer = await readFile(outputPath);

      const thumbnail = await sharp(frameBuffer)
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
      // ffmpeg not available or corrupted video — fail gracefully
      return null;
    } finally {
      // Cleanup temp files
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
    }
  }

  private runFfmpeg(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      execFile(
        'ffmpeg',
        [
          '-i',
          inputPath,
          '-ss',
          '1', // Seek to 1 second
          '-frames:v',
          '1', // Extract 1 frame
          '-y', // Overwrite output
          outputPath,
        ],
        { timeout: 10_000 },
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });
  }
}
