import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TenantIntegration } from '@/entities/sales/tenant-integration';
import { InMemoryTenantIntegrationsRepository } from '@/repositories/sales/in-memory/in-memory-tenant-integrations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DisconnectIntegrationUseCase } from './disconnect-integration';

let tenantIntegrationsRepository: InMemoryTenantIntegrationsRepository;
let disconnectIntegration: DisconnectIntegrationUseCase;

const TENANT_ID = 'tenant-1';

describe('DisconnectIntegrationUseCase', () => {
  beforeEach(() => {
    tenantIntegrationsRepository = new InMemoryTenantIntegrationsRepository();
    disconnectIntegration = new DisconnectIntegrationUseCase(
      tenantIntegrationsRepository,
    );
  });

  it('should disconnect a connected integration', async () => {
    const tenantIntegration = TenantIntegration.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      integrationId: new UniqueEntityID('integration-1'),
      config: { apiKey: 'test-key' },
      status: 'CONNECTED',
    });
    tenantIntegrationsRepository.items.push(tenantIntegration);

    const { tenantIntegration: disconnected } =
      await disconnectIntegration.execute({
        tenantId: TENANT_ID,
        tenantIntegrationId: tenantIntegration.id.toString(),
      });

    expect(disconnected.status).toBe('DISCONNECTED');
    expect(disconnected.config).toEqual({});
  });

  it('should throw ResourceNotFoundError when tenant integration does not exist', async () => {
    await expect(
      disconnectIntegration.execute({
        tenantId: TENANT_ID,
        tenantIntegrationId: 'non-existent',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when already disconnected', async () => {
    const tenantIntegration = TenantIntegration.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      integrationId: new UniqueEntityID('integration-1'),
      config: {},
      status: 'DISCONNECTED',
    });
    tenantIntegrationsRepository.items.push(tenantIntegration);

    await expect(
      disconnectIntegration.execute({
        tenantId: TENANT_ID,
        tenantIntegrationId: tenantIntegration.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
