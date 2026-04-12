import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrintAgent } from '@/entities/sales/print-agent';
import { PosPrinter } from '@/entities/sales/pos-printer';
import { InMemoryPrintAgentsRepository } from '@/repositories/sales/in-memory/in-memory-print-agents-repository';
import { InMemoryPosPrintersRepository } from '@/repositories/sales/in-memory/in-memory-pos-printers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnpairPrintAgentUseCase } from './unpair-print-agent.use-case';

let printAgentsRepository: InMemoryPrintAgentsRepository;
let posPrintersRepository: InMemoryPosPrintersRepository;
let sut: UnpairPrintAgentUseCase;

const TENANT_ID = 'tenant-01';

describe('UnpairPrintAgentUseCase', () => {
  beforeEach(() => {
    printAgentsRepository = new InMemoryPrintAgentsRepository();
    posPrintersRepository = new InMemoryPosPrintersRepository();
    sut = new UnpairPrintAgentUseCase(
      printAgentsRepository,
      posPrintersRepository,
    );
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

  it('should mark agent printers as OFFLINE and disassociate on unpair', async () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent With Printers',
    });

    agent.pair('token-hash-456', 'STOCK-PC', 'user-01');
    await printAgentsRepository.create(agent);

    const printer = PosPrinter.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'EPSON L4150',
      type: 'THERMAL',
      connection: 'USB',
      agentId: agent.id.toString(),
      status: 'ONLINE',
    });
    await posPrintersRepository.create(printer);

    await sut.execute({
      tenantId: TENANT_ID,
      agentId: agent.id.toString(),
    });

    const updatedPrinter = posPrintersRepository.items[0];
    expect(updatedPrinter.agentId).toBeUndefined();
    expect(updatedPrinter.status).toBe('OFFLINE');
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
