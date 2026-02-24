export type FileTypeValue =
  | 'document'
  | 'image'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'archive'
  | 'video'
  | 'audio'
  | 'code'
  | 'other';

const MIME_TYPE_MAP: Record<string, FileTypeValue> = {
  'application/pdf': 'pdf',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.template':
    'document',
  'application/vnd.ms-excel': 'spreadsheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    'spreadsheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template':
    'spreadsheet',
  'application/vnd.ms-powerpoint': 'presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.template':
    'presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow':
    'presentation',
  'application/zip': 'archive',
  'application/x-rar-compressed': 'archive',
  'application/x-7z-compressed': 'archive',
  'application/gzip': 'archive',
  'application/x-tar': 'archive',
  'text/javascript': 'code',
  'text/typescript': 'code',
  'application/json': 'code',
  'text/html': 'code',
  'text/css': 'code',
  'text/xml': 'code',
  'application/xml': 'code',
  'text/x-python': 'code',
  'text/x-java-source': 'code',
};

const MIME_PREFIX_MAP: Record<string, FileTypeValue> = {
  image: 'image',
  video: 'video',
  audio: 'audio',
};

export class FileType {
  private readonly fileType: FileTypeValue;

  private constructor(fileType: FileTypeValue) {
    this.fileType = fileType;
  }

  static fromMimeType(mimeType: string): FileType {
    const normalizedMime = mimeType.toLowerCase().trim();

    // Check exact MIME type match first
    const exactMatch = MIME_TYPE_MAP[normalizedMime];
    if (exactMatch) {
      return new FileType(exactMatch);
    }

    // Check prefix-based matches (image/*, video/*, audio/*)
    const mimePrefix = normalizedMime.split('/')[0];
    const prefixMatch = MIME_PREFIX_MAP[mimePrefix];
    if (prefixMatch) {
      return new FileType(prefixMatch);
    }

    // Check partial matches for office document variants
    if (normalizedMime.includes('spreadsheet')) {
      return new FileType('spreadsheet');
    }
    if (normalizedMime.includes('presentation')) {
      return new FileType('presentation');
    }
    if (normalizedMime.includes('wordprocessing')) {
      return new FileType('document');
    }

    return new FileType('other');
  }

  static create(value: FileTypeValue): FileType {
    return new FileType(value);
  }

  get value(): FileTypeValue {
    return this.fileType;
  }

  // Type Checkers
  get isDocument(): boolean {
    return this.fileType === 'document';
  }

  get isImage(): boolean {
    return this.fileType === 'image';
  }

  get isSpreadsheet(): boolean {
    return this.fileType === 'spreadsheet';
  }

  get isPresentation(): boolean {
    return this.fileType === 'presentation';
  }

  get isPdf(): boolean {
    return this.fileType === 'pdf';
  }

  get isArchive(): boolean {
    return this.fileType === 'archive';
  }

  get isVideo(): boolean {
    return this.fileType === 'video';
  }

  get isAudio(): boolean {
    return this.fileType === 'audio';
  }

  get isCode(): boolean {
    return this.fileType === 'code';
  }

  get isOther(): boolean {
    return this.fileType === 'other';
  }

  // Business Logic
  get isPreviewable(): boolean {
    return (
      this.isImage || this.isPdf || this.isVideo || this.isAudio || this.isCode
    );
  }

  get hasThumbnail(): boolean {
    return this.isImage || this.isPdf || this.isVideo;
  }

  get isMedia(): boolean {
    return this.isImage || this.isVideo || this.isAudio;
  }

  get isOfficeDocument(): boolean {
    return this.isDocument || this.isSpreadsheet || this.isPresentation;
  }

  equals(other: FileType): boolean {
    return this.fileType === other.fileType;
  }
}
