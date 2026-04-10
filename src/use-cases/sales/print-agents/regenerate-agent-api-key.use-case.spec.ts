import { compare } from 'bcryptjs';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrintAgent } from '@/entities/sales/print-agent';
import { InMemoryPrintAgentsRepository } from '@/repositories/sales/in-memory/in-memory-print-agents-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RegenerateAgentApiKeyUseCase } from './regenerate-agent-api-key.use-case';

let printAgentsRepository: InMemoryPrintAgentsRepository;
let sut: RegenerateAgentApiKeyUseCase;

const TENANT_ID = 'tenant-01';

describe('RegenerateAgentApiKeyUseCase', () => {
  beforeEach(() => {
    printAgentsRepository = new InMemoryPrintAgentsRepository();
    sut = new RegenerateAgentApiKeyUseCase(printAgentsRepository);
  });

  it('should generate a new api key', async () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent Regen',
      apiKeyHash: 'old-hash',
      apiKeyPrefix: 'osa_old1',
    });

    await printAgentsRepository.create(agent);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      agentId: agent.id.toString(),
    });

    expect(result.apiKey).toMatch(/^osa_/);
    expect(result.apiKey).not.toBe('osa_old1');
  });

  it('should update agent hash and prefix in repository', async () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent Regen Two',
      apiKeyHash: 'old-hash-two',
      apiKeyPrefix: 'osa_old2',
    });

    await printAgentsRepository.create(agent);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      agentId: agent.id.toString(),
    });

    const updatedAgent = printAgentsRepository.items[0];

    expect(updatedAgent.apiKeyPrefix).toBe(result.apiKey.slice(0, 8));

    const hashMatches = await compare(result.apiKey, updatedAgent.apiKeyHash);
    expect(hashMatches).toBe(true);
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
