import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrintAgent } from '@/entities/sales/print-agent';
import { InMemoryPrintAgentsRepository } from '@/repositories/sales/in-memory/in-memory-print-agents-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnpairPrintAgentUseCase } from './unpair-print-agent.use-case';

let printAgentsRepository: InMemoryPrintAgentsRepository;
let sut: UnpairPrintAgentUseCase;

const TENANT_ID = 'tenant-01';

describe('UnpairPrintAgentUseCase', () => {
  beforeEach(() => {
    printAgentsRepository = new InMemoryPrintAgentsRepository();
    sut = new UnpairPrintAgentUseCase(printAgentsRepository);
  });

  it('should unpair a paired agent', async () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent To Unpair',
    });

    agent.pair('token-hash-123', 'STOCK-PC', 'user-01');
    await printAgentsRepository.create(agent);

    expect(agent.isPaired).toBe(true);

    await sut.execute({
      tenantId: TENANT_ID,
      agentId: agent.id.toString(),
    });

    const updatedAgent = printAgentsRepository.items[0];

    expect(updatedAgent.revokedAt).toBeInstanceOf(Date);
    expect(updatedAgent.isPaired).toBe(false);
  });

  it('should throw ResourceNotFoundError when agent does not exist', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        agentId: 'nonexistent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
