import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TenantIntegration } from '@/entities/sales/tenant-integration';
import { InMemoryTenantIntegrationsRepository } from '@/repositories/sales/in-memory/in-memory-tenant-integrations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SyncIntegrationUseCase } from './sync-integration';

let tenantIntegrationsRepository: InMemoryTenantIntegrationsRepository;
let syncIntegration: SyncIntegrationUseCase;

const TENANT_ID = 'tenant-1';

describe('SyncIntegrationUseCase', () => {
  beforeEach(() => {
    tenantIntegrationsRepository = new InMemoryTenantIntegrationsRepository();
    syncIntegration = new SyncIntegrationUseCase(tenantIntegrationsRepository);
  });

  it('should sync a connected integration and update lastSyncAt', async () => {
    const tenantIntegration = TenantIntegration.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      integrationId: new UniqueEntityID('integration-1'),
      config: { apiKey: 'test-key' },
      status: 'CONNECTED',
    });
    tenantIntegrationsRepository.items.push(tenantIntegration);

    const { tenantIntegration: synced } = await syncIntegration.execute({
      tenantId: TENANT_ID,
      tenantIntegrationId: tenantIntegration.id.toString(),
    });

    expect(synced.lastSyncAt).toBeDefined();
  });

  it('should throw ResourceNotFoundError when tenant integration does not exist', async () => {
    await expect(
      syncIntegration.execute({
        tenantId: TENANT_ID,
        tenantIntegrationId: 'non-existent',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when integration is disconnected', async () => {
    const tenantIntegration = TenantIntegration.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      integrationId: new UniqueEntityID('integration-1'),
      config: {},
      status: 'DISCONNECTED',
    });
    tenantIntegrationsRepository.items.push(tenantIntegration);

    await expect(
      syncIntegration.execute({
        tenantId: TENANT_ID,
        tenantIntegrationId: tenantIntegration.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when integration has error status', async () => {
    const tenantIntegration = TenantIntegration.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      integrationId: new UniqueEntityID('integration-1'),
      config: { apiKey: 'test' },
      status: 'ERROR',
    });
    tenantIntegrationsRepository.items.push(tenantIntegration);

    await expect(
      syncIntegration.execute({
        tenantId: TENANT_ID,
        tenantIntegrationId: tenantIntegration.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
