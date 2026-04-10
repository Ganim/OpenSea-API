import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosPrinter } from '@/entities/sales/pos-printer';
import { PrintAgent } from '@/entities/sales/print-agent';
import { InMemoryPosPrintersRepository } from '@/repositories/sales/in-memory/in-memory-pos-printers-repository';
import { InMemoryPrintAgentsRepository } from '@/repositories/sales/in-memory/in-memory-print-agents-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeletePrintAgentUseCase } from './delete-print-agent.use-case';

let printAgentsRepository: InMemoryPrintAgentsRepository;
let posPrintersRepository: InMemoryPosPrintersRepository;
let sut: DeletePrintAgentUseCase;

const TENANT_ID = 'tenant-01';

describe('DeletePrintAgentUseCase', () => {
  beforeEach(() => {
    printAgentsRepository = new InMemoryPrintAgentsRepository();
    posPrintersRepository = new InMemoryPosPrintersRepository();
    sut = new DeletePrintAgentUseCase(
      printAgentsRepository,
      posPrintersRepository,
    );
  });

  it('should soft delete the agent', async () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent To Delete',
      apiKeyHash: 'hash-del',
      apiKeyPrefix: 'osa_del1',
    });

    await printAgentsRepository.create(agent);

    await sut.execute({
      tenantId: TENANT_ID,
      agentId: agent.id.toString(),
    });

    const deletedAgent = printAgentsRepository.items[0];
    expect(deletedAgent.deletedAt).toBeDefined();
  });

  it('should nullify agentId and set UNKNOWN status on associated printers', async () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent With Printers',
      apiKeyHash: 'hash-wp',
      apiKeyPrefix: 'osa_wp01',
    });

    await printAgentsRepository.create(agent);

    const printerOne = PosPrinter.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Printer One',
      type: 'LABEL',
      connection: 'USB',
      agentId: agent.id.toString(),
      status: 'ONLINE',
    });

    const printerTwo = PosPrinter.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Printer Two',
      type: 'LABEL',
      connection: 'USB',
      agentId: agent.id.toString(),
      status: 'ONLINE',
    });

    await posPrintersRepository.create(printerOne);
    await posPrintersRepository.create(printerTwo);

    await sut.execute({
      tenantId: TENANT_ID,
      agentId: agent.id.toString(),
    });

    for (const printer of posPrintersRepository.items) {
      expect(printer.agentId).toBeUndefined();
      expect(printer.status).toBe('UNKNOWN');
    }
  });

  it('should throw ResourceNotFoundError when agent does not exist', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        agentId: 'nonexistent-agent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
