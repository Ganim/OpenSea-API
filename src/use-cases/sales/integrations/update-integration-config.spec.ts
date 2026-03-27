import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TenantIntegration } from '@/entities/sales/tenant-integration';
import { InMemoryTenantIntegrationsRepository } from '@/repositories/sales/in-memory/in-memory-tenant-integrations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateIntegrationConfigUseCase } from './update-integration-config';

let tenantIntegrationsRepository: InMemoryTenantIntegrationsRepository;
let updateIntegrationConfig: UpdateIntegrationConfigUseCase;

const TENANT_ID = 'tenant-1';

describe('UpdateIntegrationConfigUseCase', () => {
  beforeEach(() => {
    tenantIntegrationsRepository = new InMemoryTenantIntegrationsRepository();
    updateIntegrationConfig = new UpdateIntegrationConfigUseCase(
      tenantIntegrationsRepository,
    );
  });

  it('should update the config of a connected integration', async () => {
    const tenantIntegration = TenantIntegration.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      integrationId: new UniqueEntityID('integration-1'),
      config: { apiKey: 'old-key' },
      status: 'CONNECTED',
    });
    tenantIntegrationsRepository.items.push(tenantIntegration);

    const { tenantIntegration: updated } =
      await updateIntegrationConfig.execute({
        tenantId: TENANT_ID,
        tenantIntegrationId: tenantIntegration.id.toString(),
        config: { apiKey: 'new-key', webhookUrl: 'https://example.com' },
      });

    expect(updated.config).toEqual({
      apiKey: 'new-key',
      webhookUrl: 'https://example.com',
    });
  });

  it('should throw ResourceNotFoundError when tenant integration does not exist', async () => {
    await expect(
      updateIntegrationConfig.execute({
        tenantId: TENANT_ID,
        tenantIntegrationId: 'non-existent',
        config: { apiKey: 'test' },
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
      updateIntegrationConfig.execute({
        tenantId: TENANT_ID,
        tenantIntegrationId: tenantIntegration.id.toString(),
        config: { apiKey: 'test' },
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
