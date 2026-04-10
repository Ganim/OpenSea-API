import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosPrinter } from '@/entities/sales/pos-printer';
import { PrintAgent } from '@/entities/sales/print-agent';
import { InMemoryPosPrintersRepository } from '@/repositories/sales/in-memory/in-memory-pos-printers-repository';
import { InMemoryPrintAgentsRepository } from '@/repositories/sales/in-memory/in-memory-print-agents-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { MarkAgentOfflineUseCase } from './mark-agent-offline.use-case';

let printAgentsRepository: InMemoryPrintAgentsRepository;
let posPrintersRepository: InMemoryPosPrintersRepository;
let sut: MarkAgentOfflineUseCase;

describe('MarkAgentOfflineUseCase', () => {
  beforeEach(() => {
    printAgentsRepository = new InMemoryPrintAgentsRepository();
    posPrintersRepository = new InMemoryPosPrintersRepository();
    sut = new MarkAgentOfflineUseCase(
      printAgentsRepository,
      posPrintersRepository,
    );
  });

  it('should mark stale agents and their printers as offline', async () => {
    const staleAgent = PrintAgent.create({
      tenantId: new UniqueEntityID('tenant-01'),
      name: 'Stale Agent',
      apiKeyHash: 'hash-stale',
      apiKeyPrefix: 'osa_stal',
      status: 'ONLINE',
    });

    // Simulate a heartbeat 2 hours ago
    staleAgent.recordHeartbeat('192.168.0.1');
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    // Manually set lastSeenAt to the past
    Object.assign(staleAgent, {
      props: {
        ...staleAgent['props'],
        lastSeenAt: twoHoursAgo,
      },
    });

    await printAgentsRepository.create(staleAgent);

    const agentPrinter = PosPrinter.create({
      tenantId: new UniqueEntityID('tenant-01'),
      name: 'Agent Printer',
      type: 'LABEL',
      connection: 'USB',
      agentId: staleAgent.id.toString(),
      status: 'ONLINE',
    });

    await posPrintersRepository.create(agentPrinter);

    const thresholdDate = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago

    const result = await sut.execute({ thresholdDate });

    expect(result.markedOfflineCount).toBe(1);
    expect(printAgentsRepository.items[0].status).toBe('OFFLINE');
    expect(posPrintersRepository.items[0].status).toBe('OFFLINE');
  });

  it('should skip already offline agents', async () => {
    const offlineAgent = PrintAgent.create({
      tenantId: new UniqueEntityID('tenant-01'),
      name: 'Already Offline',
      apiKeyHash: 'hash-off',
      apiKeyPrefix: 'osa_off1',
      status: 'OFFLINE',
    });

    await printAgentsRepository.create(offlineAgent);

    const result = await sut.execute({
      thresholdDate: new Date(),
    });

    expect(result.markedOfflineCount).toBe(0);
  });
});
