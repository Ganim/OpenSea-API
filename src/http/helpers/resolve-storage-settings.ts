import { prisma } from '@/lib/prisma';
import type { StorageSettings } from '@/constants/storage/allowed-mime-types';

/**
 * Resolve as configurações de storage mais restritivas entre todos os grupos
 * de permissão do usuário. Retorna null se nenhum grupo tem configurações.
 */
export async function resolveUserStorageSettings(
  userId: string,
): Promise<StorageSettings | null> {
  const groups = await prisma.userPermissionGroup.findMany({
    where: {
      userId,
      group: { deletedAt: null, isActive: true },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      group: {
        select: { storageSettings: true },
      },
    },
  });

  let merged: StorageSettings | null = null;

  for (const { group } of groups) {
    const settings = group.storageSettings as StorageSettings | null;
    if (!settings) continue;

    if (!merged) {
      merged = { ...settings };
      continue;
    }

    // Use the most restrictive values
    if (settings.allowedFileTypes?.length) {
      merged.allowedFileTypes = merged.allowedFileTypes?.length
        ? merged.allowedFileTypes.filter((t) =>
            settings.allowedFileTypes!.includes(t),
          )
        : settings.allowedFileTypes;
    }

    if (settings.maxFileSizeMb) {
      merged.maxFileSizeMb = merged.maxFileSizeMb
        ? Math.min(merged.maxFileSizeMb, settings.maxFileSizeMb)
        : settings.maxFileSizeMb;
    }

    if (settings.maxStorageMb) {
      merged.maxStorageMb = merged.maxStorageMb
        ? Math.min(merged.maxStorageMb, settings.maxStorageMb)
        : settings.maxStorageMb;
    }
  }

  return merged;
}
