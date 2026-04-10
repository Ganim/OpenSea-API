import { InMemoryPrintAgentsRepository } from '@/repositories/sales/in-memory/in-memory-print-agents-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RegisterPrintAgentUseCase } from './register-print-agent.use-case';

let printAgentsRepository: InMemoryPrintAgentsRepository;
let sut: RegisterPrintAgentUseCase;

describe('RegisterPrintAgentUseCase', () => {
  beforeEach(() => {
    printAgentsRepository = new InMemoryPrintAgentsRepository();
    sut = new RegisterPrintAgentUseCase(printAgentsRepository);
  });

  it('should register a print agent and return agent id', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-01',
      name: 'Print Agent Office',
    });

    expect(result.agentId).toBeDefined();
    expect(printAgentsRepository.items).toHaveLength(1);
    expect(printAgentsRepository.items[0].name).toBe('Print Agent Office');
  });

  it('should generate a pairing secret on creation', async () => {
    await sut.execute({
      tenantId: 'tenant-01',
      name: 'Agent Alpha',
    });

    const storedAgent = printAgentsRepository.items[0];

    expect(storedAgent.pairingSecret).toBeDefined();
    expect(storedAgent.pairingSecret).toHaveLength(64);
  });

  it('should create agent with OFFLINE default status', async () => {
    await sut.execute({
      tenantId: 'tenant-01',
      name: 'Agent Delta',
    });

    expect(printAgentsRepository.items[0].status).toBe('OFFLINE');
  });

  it('should create agent in unpaired state', async () => {
    await sut.execute({
      tenantId: 'tenant-01',
      name: 'Agent Unpaired',
    });

    const storedAgent = printAgentsRepository.items[0];

    expect(storedAgent.isPaired).toBe(false);
    expect(storedAgent.deviceTokenHash).toBeUndefined();
    expect(storedAgent.deviceLabel).toBeUndefined();
    expect(storedAgent.pairedAt).toBeUndefined();
  });
});
