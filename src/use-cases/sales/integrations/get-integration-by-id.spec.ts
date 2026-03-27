import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { Integration } from '@/entities/sales/integration';
import { InMemoryIntegrationsRepository } from '@/repositories/sales/in-memory/in-memory-integrations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetIntegrationByIdUseCase } from './get-integration-by-id';

let integrationsRepository: InMemoryIntegrationsRepository;
let getIntegrationById: GetIntegrationByIdUseCase;

describe('GetIntegrationByIdUseCase', () => {
  beforeEach(() => {
    integrationsRepository = new InMemoryIntegrationsRepository();
    getIntegrationById = new GetIntegrationByIdUseCase(integrationsRepository);
  });

  it('should get an integration by id', async () => {
    const integration = Integration.create({
      name: 'Nuvemshop',
      slug: 'nuvemshop',
      category: 'ECOMMERCE',
      configSchema: { apiKey: { type: 'string' } },
    });
    integrationsRepository.items.push(integration);

    const { integration: found } = await getIntegrationById.execute({
      integrationId: integration.id.toString(),
    });

    expect(found.name).toBe('Nuvemshop');
    expect(found.slug).toBe('nuvemshop');
    expect(found.category).toBe('ECOMMERCE');
  });

  it('should throw ResourceNotFoundError when integration does not exist', async () => {
    await expect(
      getIntegrationById.execute({
        integrationId: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
