import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosPrinter } from '@/entities/sales/pos-printer';
import { InMemoryPosPrintersRepository } from '@/repositories/sales/in-memory/in-memory-pos-printers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SyncAgentPrintersUseCase } from './sync-agent-printers.use-case';

let posPrintersRepository: InMemoryPosPrintersRepository;
let sut: SyncAgentPrintersUseCase;

const TENANT_ID = 'tenant-01';
const AGENT_ID = 'agent-01';

describe('SyncAgentPrintersUseCase', () => {
  beforeEach(() => {
    posPrintersRepository = new InMemoryPosPrintersRepository();
    sut = new SyncAgentPrintersUseCase(posPrintersRepository);
  });

  it('should create new printers for unknown OS names', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      agentId: AGENT_ID,
      printers: [
        { name: 'DYMO 450', status: 'ONLINE', isDefault: true },
        { name: 'HP LaserJet', status: 'ONLINE', isDefault: false },
      ],
    });

    expect(result.syncedPrinterIds).toHaveLength(2);
    expect(posPrintersRepository.items).toHaveLength(2);
    expect(posPrintersRepository.items[0].osName).toBe('DYMO 450');
    expect(posPrintersRepository.items[0].status).toBe('ONLINE');
    expect(posPrintersRepository.items[1].osName).toBe('HP LaserJet');
  });

  it('should update existing printers status and lastSeenAt', async () => {
    const existingPrinter = PosPrinter.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'DYMO 450',
      type: 'LABEL',
      connection: 'USB',
      osName: 'DYMO 450',
      agentId: AGENT_ID,
      status: 'OFFLINE',
    });

    await posPrintersRepository.create(existingPrinter);

    await sut.execute({
      tenantId: TENANT_ID,
      agentId: AGENT_ID,
      printers: [{ name: 'DYMO 450', status: 'ONLINE', isDefault: false }],
    });

    expect(posPrintersRepository.items).toHaveLength(1);
    expect(posPrintersRepository.items[0].status).toBe('ONLINE');
    expect(posPrintersRepository.items[0].lastSeenAt).toBeDefined();
  });

  it('should mark missing printers as OFFLINE', async () => {
    const activePrinter = PosPrinter.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Old Printer',
      type: 'LABEL',
      connection: 'USB',
      osName: 'Old Printer',
      agentId: AGENT_ID,
      status: 'ONLINE',
    });

    await posPrintersRepository.create(activePrinter);

    await sut.execute({
      tenantId: TENANT_ID,
      agentId: AGENT_ID,
      printers: [{ name: 'New Printer', status: 'ONLINE', isDefault: false }],
    });

    const oldPrinter = posPrintersRepository.items.find(
      (p) => p.osName === 'Old Printer',
    );
    expect(oldPrinter?.status).toBe('OFFLINE');
  });
});
