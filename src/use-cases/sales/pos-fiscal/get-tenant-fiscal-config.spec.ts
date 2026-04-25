import { beforeEach, describe, expect, it } from 'vitest';

import { PosFiscalConfig } from '@/entities/sales/pos-fiscal-config';
import { PosFiscalDocumentType } from '@/entities/sales/value-objects/pos-fiscal-document-type';
import { PosFiscalEmissionMode } from '@/entities/sales/value-objects/pos-fiscal-emission-mode';
import { InMemoryPosFiscalConfigsRepository } from '@/repositories/sales/in-memory/in-memory-pos-fiscal-configs-repository';

import { GetTenantFiscalConfigUseCase } from './get-tenant-fiscal-config';

let posFiscalConfigsRepository: InMemoryPosFiscalConfigsRepository;
let sut: GetTenantFiscalConfigUseCase;

const tenantId = 'tenant-fiscal-get';
const otherTenantId = 'tenant-fiscal-get-other';

function buildConfig(overrideTenantId: string = tenantId): PosFiscalConfig {
  return PosFiscalConfig.create({
    tenantId: overrideTenantId,
    enabledDocumentTypes: [PosFiscalDocumentType.NFC_E()],
    defaultDocumentType: PosFiscalDocumentType.NFC_E(),
    emissionMode: PosFiscalEmissionMode.ONLINE_SYNC(),
    nfceSeries: 1,
    nfceNextNumber: 100,
  });
}

describe('GetTenantFiscalConfigUseCase', () => {
  beforeEach(() => {
    posFiscalConfigsRepository = new InMemoryPosFiscalConfigsRepository();
    sut = new GetTenantFiscalConfigUseCase(posFiscalConfigsRepository);
  });

  it('returns the configuration when one exists for the tenant', async () => {
    const config = buildConfig();
    await posFiscalConfigsRepository.upsert(config);

    const response = await sut.execute({ tenantId });

    expect(response.fiscalConfig).not.toBeNull();
    expect(response.fiscalConfig?.tenantId).toBe(tenantId);
    expect(response.fiscalConfig?.defaultDocumentType).toBe('NFC_E');
    expect(response.fiscalConfig?.emissionMode).toBe('ONLINE_SYNC');
    expect(response.fiscalConfig?.nfceNextNumber).toBe(100);
  });

  it('returns null without throwing when no configuration exists', async () => {
    const response = await sut.execute({ tenantId });

    expect(response.fiscalConfig).toBeNull();
  });

  it('does not leak fiscal configuration from another tenant', async () => {
    const otherTenantConfig = buildConfig(otherTenantId);
    await posFiscalConfigsRepository.upsert(otherTenantConfig);

    const response = await sut.execute({ tenantId });

    expect(response.fiscalConfig).toBeNull();
  });
});
