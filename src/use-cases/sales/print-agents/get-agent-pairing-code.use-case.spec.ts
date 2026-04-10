import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrintAgent } from '@/entities/sales/print-agent';
import { InMemoryPrintAgentsRepository } from '@/repositories/sales/in-memory/in-memory-print-agents-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetAgentPairingCodeUseCase } from './get-agent-pairing-code.use-case';

let printAgentsRepository: InMemoryPrintAgentsRepository;
let sut: GetAgentPairingCodeUseCase;

const TENANT_ID = 'tenant-01';

describe('GetAgentPairingCodeUseCase', () => {
  beforeEach(() => {
    printAgentsRepository = new InMemoryPrintAgentsRepository();
    sut = new GetAgentPairingCodeUseCase(printAgentsRepository);
  });

  it('should return a 6-character pairing code', async () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent Pairing',
    });

    await printAgentsRepository.create(agent);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      agentId: agent.id.toString(),
    });

    expect(result.code).toBeDefined();
    expect(result.code).toHaveLength(6);
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it('should return an expiration date in the future', async () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent Future',
    });

    await printAgentsRepository.create(agent);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      agentId: agent.id.toString(),
    });

    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now() - 1000);
  });

  it('should return consistent code for same agent within same time bucket', async () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent Consistent',
    });

    await printAgentsRepository.create(agent);

    const firstResult = await sut.execute({
      tenantId: TENANT_ID,
      agentId: agent.id.toString(),
    });

    const secondResult = await sut.execute({
      tenantId: TENANT_ID,
      agentId: agent.id.toString(),
    });

    expect(firstResult.code).toBe(secondResult.code);
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
