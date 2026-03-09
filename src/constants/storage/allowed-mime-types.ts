/**
 * MIME types permitidos para upload de arquivos.
 * Usado tanto no upload normal quanto no multipart upload.
 */
export const ALLOWED_MIME_TYPES = new Set([
  // Imagens
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  // Documentos
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'text/plain',
  'text/csv',
  'application/rtf',
  'text/rtf',
  // Vídeos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  // Áudio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/x-wav',
  // Arquivos compactados
  'application/zip',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  // Código
  'application/json',
  'application/xml',
  'text/xml',
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
  'text/x-python',
  'text/markdown',
]);

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

/**
 * Configurações de storage definidas por Permission Group.
 * Armazenado como JSON no campo `storageSettings` do PermissionGroup.
 */
export interface StorageSettings {
  /** MIME type patterns permitidos (ex: ['image/*', 'application/pdf']) */
  allowedFileTypes?: string[];
  /** Tamanho máximo por arquivo em MB */
  maxFileSizeMb?: number;
  /** Quota total de armazenamento do grupo em MB */
  maxStorageMb?: number;
}

/**
 * Verifica se um MIME type corresponde a um pattern de tipo permitido.
 * Suporta wildcards como 'image/*', 'application/*', etc.
 */
export function matchesMimePattern(mimeType: string, pattern: string): boolean {
  if (pattern === '*' || pattern === '*/*') return true;
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2);
    return mimeType.startsWith(prefix + '/');
  }
  return mimeType === pattern;
}

/**
 * Valida um arquivo contra StorageSettings de um grupo.
 * Retorna null se válido, ou mensagem de erro se inválido.
 */
export function validateAgainstStorageSettings(
  mimeType: string,
  fileSizeBytes: number,
  settings: StorageSettings,
): string | null {
  // Validar tipo de arquivo
  if (settings.allowedFileTypes && settings.allowedFileTypes.length > 0) {
    const allowed = settings.allowedFileTypes.some((pattern) =>
      matchesMimePattern(mimeType, pattern),
    );
    if (!allowed) {
      return `Tipo de arquivo não permitido pelo seu grupo de permissões: ${mimeType}`;
    }
  }

  // Validar tamanho máximo
  if (settings.maxFileSizeMb && settings.maxFileSizeMb > 0) {
    const maxBytes = settings.maxFileSizeMb * 1024 * 1024;
    if (fileSizeBytes > maxBytes) {
      return `Arquivo excede o limite de ${settings.maxFileSizeMb} MB do seu grupo de permissões`;
    }
  }

  return null;
}
