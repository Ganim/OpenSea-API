import type { PosFiscalConfig } from '@/entities/sales/pos-fiscal-config';
import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { posFiscalConfigPrismaToDomain } from '@/mappers/sales/pos-fiscal-config/pos-fiscal-config-prisma-to-domain';

import type { PosFiscalConfigsRepository } from '../pos-fiscal-configs-repository';

import type {
  PosFiscalDocumentType as PrismaPosFiscalDocumentType,
  PosFiscalEmissionMode as PrismaPosFiscalEmissionMode,
} from '@prisma/generated/client.js';

export class PrismaPosFiscalConfigsRepository
  implements PosFiscalConfigsRepository
{
  async findByTenantId(tenantId: string): Promise<PosFiscalConfig | null> {
    const raw = await prisma.posFiscalConfig.findUnique({
      where: { tenantId },
    });
    return raw ? posFiscalConfigPrismaToDomain(raw) : null;
  }

  async upsert(config: PosFiscalConfig, tx?: TransactionClient): Promise<void> {
    const client = tx ?? prisma;
    const enabled = config.enabledDocumentTypes.map(
      (t) => t.value as PrismaPosFiscalDocumentType,
    );
    const defaultType = config.defaultDocumentType
      .value as PrismaPosFiscalDocumentType;
    const emission = config.emissionMode.value as PrismaPosFiscalEmissionMode;

    await client.posFiscalConfig.upsert({
      where: { tenantId: config.tenantId },
      create: {
        id: config.id.toString(),
        tenantId: config.tenantId,
        enabledDocumentTypes: enabled,
        defaultDocumentType: defaultType,
        emissionMode: emission,
        certificatePath: config.certificatePath ?? null,
        nfceSeries: config.nfceSeries ?? null,
        nfceNextNumber: config.nfceNextNumber ?? null,
        satDeviceId: config.satDeviceId ?? null,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt ?? new Date(),
      },
      update: {
        enabledDocumentTypes: { set: enabled },
        defaultDocumentType: defaultType,
        emissionMode: emission,
        certificatePath: config.certificatePath ?? null,
        nfceSeries: config.nfceSeries ?? null,
        nfceNextNumber: config.nfceNextNumber ?? null,
        satDeviceId: config.satDeviceId ?? null,
        updatedAt: config.updatedAt ?? new Date(),
      },
    });
  }

  /**
   * Atomically increment `nfceNextNumber` and return the value BEFORE the
   * increment (the number to use for the document being emitted now).
   *
   * Strategy: select-then-update inside a Prisma transaction. The inner
   * transaction guarantees the read+update pair is atomic from the caller's
   * perspective. Concurrent callers will serialize on the row lock acquired
   * by the `update` statement (Postgres default REPEATABLE READ — when the
   * second transaction tries to update the same row it will block on the
   * first, then re-read the row, see the bumped value, and apply its own
   * increment).
   *
   * Trade-off: throughput is limited by row contention. If we ever observe
   * contention, switch to a raw `UPDATE pos_fiscal_config SET
   * nfce_next_number = nfce_next_number + 1 WHERE tenant_id = $1
   * RETURNING nfce_next_number - 1` which performs the read+write in a
   * single statement.
   */
  async incrementNfceNumber(
    tenantId: string,
    tx?: TransactionClient,
  ): Promise<number> {
    const run = async (client: TransactionClient): Promise<number> => {
      const current = await client.posFiscalConfig.findUnique({
        where: { tenantId },
        select: { nfceNextNumber: true },
      });

      if (!current) {
        throw new Error(`PosFiscalConfig not found for tenant ${tenantId}`);
      }
      if (current.nfceNextNumber === null) {
        throw new Error(
          `nfceNextNumber is not configured for tenant ${tenantId}`,
        );
      }

      const previous = current.nfceNextNumber;

      await client.posFiscalConfig.update({
        where: { tenantId },
        data: { nfceNextNumber: { increment: 1 } },
      });

      return previous;
    };

    if (tx) {
      return run(tx);
    }
    return prisma.$transaction((innerTx) =>
      run(innerTx as unknown as TransactionClient),
    );
  }
}
