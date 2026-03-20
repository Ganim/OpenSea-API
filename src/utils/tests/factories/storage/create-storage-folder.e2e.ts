import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function createStorageFolderE2E(options: {
  tenantId: string;
  name?: string;
  parentId?: string;
  createdBy?: string;
  isSystem?: boolean;
  isFilter?: boolean;
  filterFileType?: string;
  module?: string;
  entityType?: string;
  entityId?: string;
}) {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 6);
  const name = options.name ?? `Test Folder ${timestamp}-${rand}`;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  let path = `/${slug}`;
  let depth = 0;

  if (options.parentId) {
    const parent = await prisma.storageFolder.findUnique({
      where: { id: options.parentId },
    });
    if (parent) {
      path = `${parent.path}/${slug}`;
      depth = parent.depth + 1;
    }
  }

  const folder = await prisma.storageFolder.create({
    data: {
      id: randomUUID(),
      tenantId: options.tenantId,
      parentId: options.parentId ?? null,
      name,
      slug,
      path,
      depth,
      isSystem: options.isSystem ?? false,
      isFilter: options.isFilter ?? false,
      filterFileType: options.filterFileType ?? null,
      module: options.module ?? null,
      entityType: options.entityType ?? null,
      entityId: options.entityId ?? null,
      createdBy: options.createdBy ?? null,
    },
  });

  return { folder, folderId: folder.id };
}
