import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TenantIntegration } from '@/entities/sales/tenant-integration';
import { InMemoryTenantIntegrationsRepository } from '@/repositories/sales/in-memory/in-memory-tenant-integrations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTenantIntegrationsUseCase } from './get-tenant-integrations';

let tenantIntegrationsRepository: InMemoryTenantIntegrationsRepository;
let getTenantIntegrations: GetTenantIntegrationsUseCase;

const TENANT_ID = 'tenant-1';

describe('GetTenantIntegrationsUseCase', () => {
  beforeEach(() => {
    tenantIntegrationsRepository = new InMemoryTenantIntegrationsRepository();
    getTenantIntegrations = new GetTenantIntegrationsUseCase(
      tenantIntegrationsRepository,
    );
  });

  it('should list all tenant integrations', async () => {
    tenantIntegrationsRepository.items.push(
      TenantIntegration.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        integrationId: new UniqueEntityID('integration-1'),
        config: { apiKey: 'key-1' },
        status: 'CONNECTED',
      }),
      TenantIntegration.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        integrationId: new UniqueEntityID('integration-2'),
        config: {},
        status: 'DISCONNECTED',
      }),
    );

    const { tenantIntegrations } = await getTenantIntegrations.execute({
      tenantId: TENANT_ID,
    });

    expect(tenantIntegrations).toHaveLength(2);
  });

  it('should return empty array when tenant has no integrations', async () => {
    const { tenantIntegrations } = await getTenantIntegrations.execute({
      tenantId: TENANT_ID,
    });

    expect(tenantIntegrations).toHaveLength(0);
  });

  it('should only return integrations for the specified tenant', async () => {
    tenantIntegrationsRepository.items.push(
      TenantIntegration.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        integrationId: new UniqueEntityID('integration-1'),
        config: {},
        status: 'CONNECTED',
      }),
      TenantIntegration.create({
        tenantId: new UniqueEntityID('other-tenant'),
        integrationId: new UniqueEntityID('integration-2'),
        config: {},
        status: 'CONNECTED',
      }),
    );

    const { tenantIntegrations } = await getTenantIntegrations.execute({
      tenantId: TENANT_ID,
    });

    expect(tenantIntegrations).toHaveLength(1);
    expect(tenantIntegrations[0].tenantId).toBe(TENANT_ID);
  });
});
