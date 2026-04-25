import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PosFiscalConfig } from '@/entities/sales/pos-fiscal-config';
import { PosFiscalDocumentType } from '@/entities/sales/value-objects/pos-fiscal-document-type';
import { PosFiscalEmissionMode } from '@/entities/sales/value-objects/pos-fiscal-emission-mode';
import { InMemoryPosFiscalConfigsRepository } from '@/repositories/sales/in-memory/in-memory-pos-fiscal-configs-repository';

import { UpdateTenantFiscalConfigUseCase } from './update-tenant-fiscal-config';

let posFiscalConfigsRepository: InMemoryPosFiscalConfigsRepository;
let sut: UpdateTenantFiscalConfigUseCase;

const tenantId = 'tenant-fiscal-update';
const userId = 'user-admin';

describe('UpdateTenantFiscalConfigUseCase', () => {
  beforeEach(() => {
    posFiscalConfigsRepository = new InMemoryPosFiscalConfigsRepository();
    sut = new UpdateTenantFiscalConfigUseCase(posFiscalConfigsRepository);
  });

  it('creates a fresh fiscal config when none exists for the tenant', async () => {
    const response = await sut.execute({
      tenantId,
      userId,
      enabledDocumentTypes: ['NFC_E'],
      defaultDocumentType: 'NFC_E',
      emissionMode: 'ONLINE_SYNC',
      certificatePath: '/secure/cert.pfx',
      nfceSeries: 1,
      nfceNextNumber: 1,
    });

    expect(response.fiscalConfig.tenantId).toBe(tenantId);
    expect(response.fiscalConfig.defaultDocumentType).toBe('NFC_E');
    expect(response.fiscalConfig.emissionMode).toBe('ONLINE_SYNC');
    expect(response.fiscalConfig.nfceSeries).toBe(1);
    expect(response.fiscalConfig.nfceNextNumber).toBe(1);
    expect(response.fiscalConfig.certificatePath).toBe('/secure/cert.pfx');

    const persisted = await posFiscalConfigsRepository.findByTenantId(tenantId);
    expect(persisted).not.toBeNull();
    expect(persisted!.defaultDocumentType.value).toBe('NFC_E');
  });

  it('updates an existing fiscal config in place (preserves id and createdAt)', async () => {
    const initial = PosFiscalConfig.create({
      tenantId,
      enabledDocumentTypes: [PosFiscalDocumentType.NFC_E()],
      defaultDocumentType: PosFiscalDocumentType.NFC_E(),
      emissionMode: PosFiscalEmissionMode.NONE(),
    });
    await posFiscalConfigsRepository.upsert(initial);

    const initialId = initial.id.toString();
    const initialCreatedAt = initial.createdAt;

    const response = await sut.execute({
      tenantId,
      userId,
      enabledDocumentTypes: ['NFC_E'],
      defaultDocumentType: 'NFC_E',
      emissionMode: 'ONLINE_SYNC',
      certificatePath: '/secure/cert.pfx',
      nfceSeries: 2,
      nfceNextNumber: 50,
    });

    expect(response.fiscalConfig.id).toBe(initialId);
    expect(response.fiscalConfig.emissionMode).toBe('ONLINE_SYNC');
    expect(response.fiscalConfig.nfceNextNumber).toBe(50);

    const persisted = await posFiscalConfigsRepository.findByTenantId(tenantId);
    expect(persisted!.id.toString()).toBe(initialId);
    expect(persisted!.createdAt).toEqual(initialCreatedAt);
    expect(persisted!.updatedAt).toBeInstanceOf(Date);
  });

  it('rejects when defaultDocumentType is not in enabledDocumentTypes', async () => {
    await expect(
      sut.execute({
        tenantId,
        userId,
        enabledDocumentTypes: ['NFC_E'],
        defaultDocumentType: 'NFE',
        emissionMode: 'NONE',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects when defaultDocumentType=NFC_E and emissionMode=ONLINE_SYNC but nfceSeries/nfceNextNumber are missing', async () => {
    await expect(
      sut.execute({
        tenantId,
        userId,
        enabledDocumentTypes: ['NFC_E'],
        defaultDocumentType: 'NFC_E',
        emissionMode: 'ONLINE_SYNC',
        certificatePath: '/secure/cert.pfx',
        // nfceSeries / nfceNextNumber omitted on purpose
      }),
    ).rejects.toBeInstanceOf(BadRequestError);

    await expect(
      sut.execute({
        tenantId,
        userId,
        enabledDocumentTypes: ['NFC_E'],
        defaultDocumentType: 'NFC_E',
        emissionMode: 'ONLINE_SYNC',
        certificatePath: '/secure/cert.pfx',
        nfceSeries: 1,
        // nfceNextNumber omitted
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects when transmitting mode + NFE/NFC_E default but certificatePath is missing', async () => {
    await expect(
      sut.execute({
        tenantId,
        userId,
        enabledDocumentTypes: ['NFC_E'],
        defaultDocumentType: 'NFC_E',
        emissionMode: 'ONLINE_SYNC',
        nfceSeries: 1,
        nfceNextNumber: 1,
        // certificatePath omitted
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('allows emissionMode=NONE without certificate / counter requirements', async () => {
    const response = await sut.execute({
      tenantId,
      userId,
      enabledDocumentTypes: ['NFC_E', 'NFE'],
      defaultDocumentType: 'NFC_E',
      emissionMode: 'NONE',
    });

    expect(response.fiscalConfig.emissionMode).toBe('NONE');
    expect(response.fiscalConfig.certificatePath).toBeNull();
    expect(response.fiscalConfig.nfceSeries).toBeNull();
    expect(response.fiscalConfig.nfceNextNumber).toBeNull();
  });

  it('rejects when enabledDocumentTypes is empty', async () => {
    await expect(
      sut.execute({
        tenantId,
        userId,
        enabledDocumentTypes: [],
        defaultDocumentType: 'NFC_E',
        emissionMode: 'NONE',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects when nfceSeries is zero or negative', async () => {
    await expect(
      sut.execute({
        tenantId,
        userId,
        enabledDocumentTypes: ['NFC_E'],
        defaultDocumentType: 'NFC_E',
        emissionMode: 'ONLINE_SYNC',
        certificatePath: '/secure/cert.pfx',
        nfceSeries: 0,
        nfceNextNumber: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('deduplicates repeated document types in enabledDocumentTypes', async () => {
    const response = await sut.execute({
      tenantId,
      userId,
      enabledDocumentTypes: ['NFC_E', 'NFC_E'],
      defaultDocumentType: 'NFC_E',
      emissionMode: 'NONE',
    });

    expect(response.fiscalConfig.enabledDocumentTypes).toEqual(['NFC_E']);
  });
});
