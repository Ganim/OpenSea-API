import { describe, it, expect } from 'vitest';

import { PosFiscalConfig } from '@/entities/sales/pos-fiscal-config';
import { PosFiscalDocumentType } from '@/entities/sales/value-objects/pos-fiscal-document-type';

import { InMemoryPosFiscalConfigsRepository } from './in-memory-pos-fiscal-configs-repository';

describe('InMemoryPosFiscalConfigsRepository', () => {
  it('compiles and instantiates', async () => {
    const repo = new InMemoryPosFiscalConfigsRepository();
    expect(repo.items).toEqual([]);
  });

  it('upserts, fetches, and increments NF-C-e number', async () => {
    const repo = new InMemoryPosFiscalConfigsRepository();
    const config = PosFiscalConfig.create({
      tenantId: 'tenant-1',
      enabledDocumentTypes: [PosFiscalDocumentType.NFC_E()],
      defaultDocumentType: PosFiscalDocumentType.NFC_E(),
      nfceSeries: 1,
      nfceNextNumber: 100,
    });

    await repo.upsert(config);
    expect(repo.items).toHaveLength(1);

    const found = await repo.findByTenantId('tenant-1');
    expect(found?.nfceNextNumber).toBe(100);

    const previous = await repo.incrementNfceNumber('tenant-1');
    expect(previous).toBe(100);

    const after = await repo.findByTenantId('tenant-1');
    expect(after?.nfceNextNumber).toBe(101);
  });
});
