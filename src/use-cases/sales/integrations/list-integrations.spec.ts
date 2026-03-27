import { Integration } from '@/entities/sales/integration';
import { InMemoryIntegrationsRepository } from '@/repositories/sales/in-memory/in-memory-integrations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListIntegrationsUseCase } from './list-integrations';

let integrationsRepository: InMemoryIntegrationsRepository;
let listIntegrations: ListIntegrationsUseCase;

describe('ListIntegrationsUseCase', () => {
  beforeEach(() => {
    integrationsRepository = new InMemoryIntegrationsRepository();
    listIntegrations = new ListIntegrationsUseCase(integrationsRepository);
  });

  it('should list all available integrations', async () => {
    integrationsRepository.items.push(
      Integration.create({
        name: 'Nuvemshop',
        slug: 'nuvemshop',
        category: 'ECOMMERCE',
        configSchema: {},
        isAvailable: true,
      }),
      Integration.create({
        name: 'Shopify',
        slug: 'shopify',
        category: 'ECOMMERCE',
        configSchema: {},
        isAvailable: true,
      }),
    );

    const { integrations } = await listIntegrations.execute();

    expect(integrations).toHaveLength(2);
    expect(integrations[0].name).toBe('Nuvemshop');
    expect(integrations[1].name).toBe('Shopify');
  });

  it('should not list unavailable integrations', async () => {
    integrationsRepository.items.push(
      Integration.create({
        name: 'Available',
        slug: 'available',
        category: 'ECOMMERCE',
        configSchema: {},
        isAvailable: true,
      }),
      Integration.create({
        name: 'Unavailable',
        slug: 'unavailable',
        category: 'ECOMMERCE',
        configSchema: {},
        isAvailable: false,
      }),
    );

    const { integrations } = await listIntegrations.execute();

    expect(integrations).toHaveLength(1);
    expect(integrations[0].name).toBe('Available');
  });

  it('should return empty array when no integrations exist', async () => {
    const { integrations } = await listIntegrations.execute();

    expect(integrations).toHaveLength(0);
  });
});
