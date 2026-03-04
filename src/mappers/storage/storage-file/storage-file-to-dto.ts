import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFileVersionDTO } from '../storage-file-version/storage-file-version-to-dto';
import { storageFileVersionToDTO } from '../storage-file-version/storage-file-version-to-dto';

export interface StorageFileDTO {
  id: string;
  tenantId: string;
  folderId: string | null;
  name: string;
  originalName: string;
  fileKey: string;
  path: string;
  size: number;
  mimeType: string;
  fileType: string;
  thumbnailKey: string | null;
  status: string;
  currentVersion: number;
  entityType: string | null;
  entityId: string | null;
  expiresAt: Date | null;
  uploadedBy: string;
  isEncrypted: boolean;
  isProtected: boolean;
  isHidden: boolean;
  versions?: StorageFileVersionDTO[];
  createdAt: Date;
  updatedAt?: Date;
}

export function storageFileToDTO(file: StorageFile): StorageFileDTO {
  return {
    id: file.fileId.toString(),
    tenantId: file.tenantId.toString(),
    folderId: file.folderId?.toString() ?? null,
    name: file.name,
    originalName: file.originalName,
    fileKey: file.fileKey,
    path: file.path,
    size: file.size,
    mimeType: file.mimeType,
    fileType: file.fileType,
    thumbnailKey: file.thumbnailKey,
    status: file.status.value,
    currentVersion: file.currentVersion,
    entityType: file.entityType,
    entityId: file.entityId,
    expiresAt: file.expiresAt,
    uploadedBy: file.uploadedBy,
    isEncrypted: file.isEncrypted,
    isProtected: file.isProtected,
    isHidden: file.isHidden,
    versions: file.versions?.map(storageFileVersionToDTO),
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}
