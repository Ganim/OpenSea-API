import type { StorageShareLink } from '@/entities/storage/storage-share-link';

export interface StorageShareLinkDTO {
  id: string;
  tenantId: string;
  fileId: string;
  token: string;
  expiresAt: Date | null;
  maxDownloads: number | null;
  downloadCount: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export function storageShareLinkToDTO(
  shareLink: StorageShareLink,
): StorageShareLinkDTO {
  return {
    id: shareLink.shareLinkId.toString(),
    tenantId: shareLink.tenantId.toString(),
    fileId: shareLink.fileId.toString(),
    token: shareLink.token,
    expiresAt: shareLink.expiresAt,
    maxDownloads: shareLink.maxDownloads,
    downloadCount: shareLink.downloadCount,
    isActive: shareLink.isActive,
    createdBy: shareLink.createdBy,
    createdAt: shareLink.createdAt,
    updatedAt: shareLink.updatedAt,
  };
}
