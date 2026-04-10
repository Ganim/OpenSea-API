import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosPrinter } from '@/entities/sales/pos-printer';
import { PrintAgent } from '@/entities/sales/print-agent';
import { InMemoryPosPrintersRepository } from '@/repositories/sales/in-memory/in-memory-pos-printers-repository';
import { InMemoryPrintAgentsRepository } from '@/repositories/sales/in-memory/in-memory-print-agents-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPrintAgentsUseCase } from './list-print-agents.use-case';

let printAgentsRepository: InMemoryPrintAgentsRepository;
let posPrintersRepository: InMemoryPosPrintersRepository;
let sut: ListPrintAgentsUseCase;

const TENANT_ID = 'tenant-01';

describe('ListPrintAgentsUseCase', () => {
  beforeEach(() => {
    printAgentsRepository = new InMemoryPrintAgentsRepository();
    posPrintersRepository = new InMemoryPosPrintersRepository();
    sut = new ListPrintAgentsUseCase(
      printAgentsRepository,
      posPrintersRepository,
    );
  });

  it('should return empty list when no agents exist', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.agents).toHaveLength(0);
  });

  it('should return agents with correct printer count', async () => {
    const agentOne = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent One',
      apiKeyHash: 'hash-one',
      apiKeyPrefix: 'osa_abcd',
    });

    const agentTwo = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Agent Two',
      apiKeyHash: 'hash-two',
      apiKeyPrefix: 'osa_efgh',
    });

    await printAgentsRepository.create(agentOne);
    await printAgentsRepository.create(agentTwo);

    // Add 2 printers to agent one
    await posPrintersRepository.create(
      PosPrinter.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        name: 'Printer A',
        type: 'LABEL',
        connection: 'USB',
        agentId: agentOne.id.toString(),
      }),
    );

    await posPrintersRepository.create(
      PosPrinter.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        name: 'Printer B',
        type: 'LABEL',
        connection: 'USB',
        agentId: agentOne.id.toString(),
      }),
    );

    // Add 1 printer to agent two
    await posPrintersRepository.create(
      PosPrinter.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        name: 'Printer C',
        type: 'LABEL',
        connection: 'USB',
        agentId: agentTwo.id.toString(),
      }),
    );

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.agents).toHaveLength(2);

    const agentOneResult = result.agents.find(
      (a) => a.agent.id.toString() === agentOne.id.toString(),
    );
    const agentTwoResult = result.agents.find(
      (a) => a.agent.id.toString() === agentTwo.id.toString(),
    );

    expect(agentOneResult?.printerCount).toBe(2);
    expect(agentTwoResult?.printerCount).toBe(1);
  });

  it('should not return agents from other tenants', async () => {
    const agentOwn = PrintAgent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Own Agent',
      apiKeyHash: 'hash-own',
      apiKeyPrefix: 'osa_own1',
    });

    const agentOther = PrintAgent.create({
      tenantId: new UniqueEntityID('other-tenant'),
      name: 'Other Agent',
      apiKeyHash: 'hash-other',
      apiKeyPrefix: 'osa_othr',
    });

    await printAgentsRepository.create(agentOwn);
    await printAgentsRepository.create(agentOther);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.agents).toHaveLength(1);
    expect(result.agents[0].agent.name).toBe('Own Agent');
  });
});
