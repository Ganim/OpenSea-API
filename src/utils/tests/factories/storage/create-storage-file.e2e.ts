import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function createStorageFileE2E(options: {
  tenantId: string;
  folderId: string;
  uploadedBy: string;
  name?: string;
  size?: number;
  mimeType?: string;
  fileType?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
}) {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 6);
  const name = options.name ?? `test-file-${timestamp}-${rand}.txt`;
  const fileKey = `test/${randomUUID()}-${name}`;

  const folder = await prisma.storageFolder.findUnique({
    where: { id: options.folderId },
  });
  const path = folder ? `${folder.path}/${name}` : `/${name}`;

  const file = await prisma.storageFile.create({
    data: {
      id: randomUUID(),
      tenantId: options.tenantId,
      folderId: options.folderId,
      name,
      originalName: name,
      fileKey,
      path,
      size: options.size ?? 1024,
      mimeType: options.mimeType ?? 'text/plain',
      fileType: options.fileType ?? 'DOCUMENT',
      status: options.status ?? 'ACTIVE',
      currentVersion: 1,
      uploadedBy: options.uploadedBy,
    },
  });

  const version = await prisma.storageFileVersion.create({
    data: {
      id: randomUUID(),
      fileId: file.id,
      version: 1,
      fileKey,
      size: options.size ?? 1024,
      mimeType: options.mimeType ?? 'text/plain',
      uploadedBy: options.uploadedBy,
    },
  });

  return { file, fileId: file.id, version, versionId: version.id };
}
