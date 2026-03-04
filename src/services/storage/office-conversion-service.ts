import { execFile } from 'child_process';
import { writeFile, readFile, rm, mkdtemp } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const CONVERTIBLE_MIMES = [
  // Word
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  // Excel
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  // PowerPoint
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint', // .ppt
  // OpenDocument
  'application/vnd.oasis.opendocument.text', // .odt
  'application/vnd.oasis.opendocument.spreadsheet', // .ods
  'application/vnd.oasis.opendocument.presentation', // .odp
];

/** Maximum conversion time (30 seconds) */
const CONVERSION_TIMEOUT = 30_000;

export class OfficeConversionService {
  /**
   * Checks whether the given MIME type can be converted to PDF.
   */
  canConvert(mimeType: string): boolean {
    return CONVERTIBLE_MIMES.includes(mimeType);
  }

  /**
   * Converts an office document buffer to PDF using LibreOffice headless.
   *
   * @param buffer - The original file bytes
   * @param originalName - Used to derive the correct file extension
   * @returns PDF buffer
   * @throws If LibreOffice is not installed or conversion fails
   */
  async convertToPdf(buffer: Buffer, originalName: string): Promise<Buffer> {
    const tempDir = await mkdtemp(join(tmpdir(), 'office-convert-'));
    const inputPath = join(tempDir, originalName);

    try {
      await writeFile(inputPath, buffer);

      await execFileAsync(
        'libreoffice',
        [
          '--headless',
          '--norestore',
          '--nolockcheck',
          '--convert-to',
          'pdf',
          '--outdir',
          tempDir,
          inputPath,
        ],
        { timeout: CONVERSION_TIMEOUT },
      );

      // LibreOffice outputs <basename>.pdf in the same directory
      const baseName = originalName.replace(/\.[^.]+$/, '');
      const outputPath = join(tempDir, `${baseName}.pdf`);

      return await readFile(outputPath);
    } finally {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
