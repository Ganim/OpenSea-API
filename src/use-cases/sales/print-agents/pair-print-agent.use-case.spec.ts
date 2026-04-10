import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrintAgent } from '@/entities/sales/print-agent';
import { getCurrentPairingCode } from '@/lib/pos-pairing-code';
import { InMemoryPrintAgentsRepository } from '@/repositories/sales/in-memory/in-memory-print-agents-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { PairPrintAgentUseCase } from './pair-print-agent.use-case';

let printAgentsRepository: InMemoryPrintAgentsRepository;
let sut: PairPrintAgentUseCase;

const TENANT_ID = 'tenant-01';

describe('PairPrintAgentUseCase', () => {
  beforeEach(() => {
    printAgentsRepository = new InMemoryPrintAgentsRepository();
    sut = new PairPrintAgentUseCase(printAgentsRepository);
  });

  it('should pair an agent with a valid pairing code', async () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent To Pair',
    });

    await printAgentsRepository.create(agent);

    const { code } = getCurrentPairingCode(agent.pairingSecret);

    const result = await sut.execute({
      pairingCode: code,
      hostname: 'STOCK-PC',
    });

    expect(result.deviceToken).toBeDefined();
    expect(result.deviceToken).toHaveLength(64); // 32 bytes hex
    expect(result.agentId).toBe(agent.id.toString());
    expect(result.agentName).toBe('Agent To Pair');
  });

  it('should store device token hash and pairing metadata', async () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent Metadata',
    });

    await printAgentsRepository.create(agent);

    const { code } = getCurrentPairingCode(agent.pairingSecret);

    await sut.execute({
      pairingCode: code,
      hostname: 'WAREHOUSE-PC',
    });

    const updatedAgent = printAgentsRepository.items[0];

    expect(updatedAgent.isPaired).toBe(true);
    expect(updatedAgent.deviceTokenHash).toBeDefined();
    expect(updatedAgent.deviceLabel).toBe('WAREHOUSE-PC');
    expect(updatedAgent.pairedAt).toBeInstanceOf(Date);
    expect(updatedAgent.revokedAt).toBeUndefined();
  });

  it('should accept lowercase pairing code', async () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent Lowercase',
    });

    await printAgentsRepository.create(agent);

    const { code } = getCurrentPairingCode(agent.pairingSecret);

    const result = await sut.execute({
      pairingCode: code.toLowerCase(),
      hostname: 'PC-01',
    });

    expect(result.agentId).toBe(agent.id.toString());
  });

  it('should throw BadRequestError for invalid pairing code', async () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent Invalid',
    });

    await printAgentsRepository.create(agent);

    await expect(() =>
      sut.execute({
        pairingCode: 'ZZZZZZ',
        hostname: 'PC-01',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when agent is already paired', async () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent Already Paired',
    });

    agent.pair('existing-hash', 'existing-label', 'user-existing');
    await printAgentsRepository.create(agent);

    const { code } = getCurrentPairingCode(agent.pairingSecret);

    await expect(() =>
      sut.execute({
        pairingCode: code,
        hostname: 'PC-01',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should match agents across tenants (global search)', async () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID('other-tenant'),
      name: 'Other Tenant Agent',
    });

    await printAgentsRepository.create(agent);

    const { code } = getCurrentPairingCode(agent.pairingSecret);

    // Should succeed — pairing code search is global (no tenant scoping)
    const result = await sut.execute({
      pairingCode: code,
      hostname: 'PC-01',
    });

    expect(result.agentId).toBe(agent.id.toString());
    expect(result.agentName).toBe('Other Tenant Agent');
  });
});
