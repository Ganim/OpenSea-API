import type { StorageFileVersion } from '@/entities/storage/storage-file-version';

export interface StorageFileVersionDTO {
  id: string;
  fileId: string;
  version: number;
  fileKey: string;
  size: number;
  mimeType: string;
  changeNote: string | null;
  uploadedBy: string;
  createdAt: Date;
}

export function storageFileVersionToDTO(
  fileVersion: StorageFileVersion,
): StorageFileVersionDTO {
  return {
    id: fileVersion.versionId.toString(),
    fileId: fileVersion.fileId.toString(),
    version: fileVersion.version,
    fileKey: fileVersion.fileKey,
    size: fileVersion.size,
    mimeType: fileVersion.mimeType,
    changeNote: fileVersion.changeNote,
    uploadedBy: fileVersion.uploadedBy,
    createdAt: fileVersion.createdAt,
  };
}
