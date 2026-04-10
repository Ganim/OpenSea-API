import { compare } from 'bcryptjs';
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

  it('should register a print agent and return api key', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-01',
      name: 'Print Agent Office',
    });

    expect(result.agentId).toBeDefined();
    expect(result.apiKey).toBeDefined();
    expect(printAgentsRepository.items).toHaveLength(1);
    expect(printAgentsRepository.items[0].name).toBe('Print Agent Office');
  });

  it('should generate api key starting with osa_ prefix', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-01',
      name: 'Agent Alpha',
    });

    expect(result.apiKey).toMatch(/^osa_/);
  });

  it('should store a bcrypt hash of the api key', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-01',
      name: 'Agent Beta',
    });

    const storedAgent = printAgentsRepository.items[0];
    const hashMatches = await compare(result.apiKey, storedAgent.apiKeyHash);

    expect(hashMatches).toBe(true);
  });

  it('should store the first 8 characters as key prefix', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-01',
      name: 'Agent Gamma',
    });

    const storedAgent = printAgentsRepository.items[0];

    expect(storedAgent.apiKeyPrefix).toBe(result.apiKey.slice(0, 8));
  });

  it('should create agent with OFFLINE default status', async () => {
    await sut.execute({
      tenantId: 'tenant-01',
      name: 'Agent Delta',
    });

    expect(printAgentsRepository.items[0].status).toBe('OFFLINE');
  });
});
