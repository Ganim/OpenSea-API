import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryLeadRoutingRulesRepository } from '@/repositories/sales/in-memory/in-memory-lead-routing-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteRoutingRuleUseCase } from './delete-routing-rule';

let leadRoutingRulesRepository: InMemoryLeadRoutingRulesRepository;
let sut: DeleteRoutingRuleUseCase;

describe('Delete Routing Rule Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    leadRoutingRulesRepository = new InMemoryLeadRoutingRulesRepository();
    sut = new DeleteRoutingRuleUseCase(leadRoutingRulesRepository);
  });

  it('should soft-delete a routing rule', async () => {
    const created = await leadRoutingRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'To Delete',
      strategy: 'ROUND_ROBIN',
      assignToUsers: ['user-1'],
    });

    const { message } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
    });

    expect(message).toBe('Routing rule deleted successfully.');

    const found = await leadRoutingRulesRepository.findById(
      created.id,
      TENANT_ID,
    );
    expect(found).toBeNull();
  });

  it('should throw if routing rule does not exist', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
