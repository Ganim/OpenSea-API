import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { Integration } from '@/entities/sales/integration';
import { InMemoryIntegrationsRepository } from '@/repositories/sales/in-memory/in-memory-integrations-repository';
import { InMemoryTenantIntegrationsRepository } from '@/repositories/sales/in-memory/in-memory-tenant-integrations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConnectIntegrationUseCase } from './connect-integration';

let integrationsRepository: InMemoryIntegrationsRepository;
let tenantIntegrationsRepository: InMemoryTenantIntegrationsRepository;
let connectIntegration: ConnectIntegrationUseCase;

const TENANT_ID = 'tenant-1';

describe('ConnectIntegrationUseCase', () => {
  beforeEach(() => {
    integrationsRepository = new InMemoryIntegrationsRepository();
    tenantIntegrationsRepository = new InMemoryTenantIntegrationsRepository();
    connectIntegration = new ConnectIntegrationUseCase(
      integrationsRepository,
      tenantIntegrationsRepository,
    );
  });

  it('should connect a tenant to an integration', async () => {
    const integration = Integration.create({
      name: 'Nuvemshop',
      slug: 'nuvemshop',
      category: 'ECOMMERCE',
      configSchema: {},
    });
    integrationsRepository.items.push(integration);

    const { tenantIntegration } = await connectIntegration.execute({
      tenantId: TENANT_ID,
      integrationId: integration.id.toString(),
      config: { apiKey: 'test-key' },
    });

    expect(tenantIntegration.status).toBe('CONNECTED');
    expect(tenantIntegration.config).toEqual({ apiKey: 'test-key' });
    expect(tenantIntegration.integrationId).toBe(integration.id.toString());
  });

  it('should throw ResourceNotFoundError when integration does not exist', async () => {
    await expect(
      connectIntegration.execute({
        tenantId: TENANT_ID,
        integrationId: 'non-existent',
        config: {},
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when integration is unavailable', async () => {
    const integration = Integration.create({
      name: 'Disabled',
      slug: 'disabled',
      category: 'ECOMMERCE',
      configSchema: {},
      isAvailable: false,
    });
    integrationsRepository.items.push(integration);

    await expect(
      connectIntegration.execute({
        tenantId: TENANT_ID,
        integrationId: integration.id.toString(),
        config: {},
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when already connected', async () => {
    const integration = Integration.create({
      name: 'Shopify',
      slug: 'shopify',
      category: 'ECOMMERCE',
      configSchema: {},
    });
    integrationsRepository.items.push(integration);

    await connectIntegration.execute({
      tenantId: TENANT_ID,
      integrationId: integration.id.toString(),
      config: { apiKey: 'key-1' },
    });

    await expect(
      connectIntegration.execute({
        tenantId: TENANT_ID,
        integrationId: integration.id.toString(),
        config: { apiKey: 'key-2' },
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reconnect a disconnected integration', async () => {
    const integration = Integration.create({
      name: 'Asaas',
      slug: 'asaas',
      category: 'PAYMENT',
      configSchema: {},
    });
    integrationsRepository.items.push(integration);

    // First connect
    const { tenantIntegration: connected } = await connectIntegration.execute({
      tenantId: TENANT_ID,
      integrationId: integration.id.toString(),
      config: { apiKey: 'old-key' },
    });

    // Manually disconnect
    const existing = tenantIntegrationsRepository.items.find(
      (item) => item.id.toString() === connected.id,
    )!;
    existing.status = 'DISCONNECTED';

    // Reconnect
    const { tenantIntegration: reconnected } = await connectIntegration.execute(
      {
        tenantId: TENANT_ID,
        integrationId: integration.id.toString(),
        config: { apiKey: 'new-key' },
      },
    );

    expect(reconnected.status).toBe('CONNECTED');
    expect(reconnected.config).toEqual({ apiKey: 'new-key' });
  });
});
