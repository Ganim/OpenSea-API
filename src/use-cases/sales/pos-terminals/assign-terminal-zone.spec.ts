import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTerminalZone } from '@/entities/sales/pos-terminal-zone';
import { PosZoneTier } from '@/entities/sales/value-objects/pos-zone-tier';
import { Zone } from '@/entities/stock/zone';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { InMemoryPosTerminalZonesRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminal-zones-repository';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { makePosTerminal } from '@/utils/tests/factories/sales/make-pos-terminal';

import { AssignTerminalZoneUseCase } from './assign-terminal-zone';

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let zonesRepository: InMemoryZonesRepository;
let posTerminalZonesRepository: InMemoryPosTerminalZonesRepository;
let sut: AssignTerminalZoneUseCase;

const tenantId = new UniqueEntityID().toString();
const adminUserId = new UniqueEntityID().toString();

function pushZone(zoneTenantId: string = tenantId): Zone {
  const zone = Zone.create({
    tenantId: new UniqueEntityID(zoneTenantId),
    warehouseId: new UniqueEntityID(),
    code: 'Z01',
    name: 'Test Zone',
    description: null,
    structure: ZoneStructure.empty(),
    layout: null,
  });
  zonesRepository.zones.push(zone);
  return zone;
}

describe('Assign POS Terminal Zone Use Case', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    zonesRepository = new InMemoryZonesRepository();
    posTerminalZonesRepository = new InMemoryPosTerminalZonesRepository();
    sut = new AssignTerminalZoneUseCase(
      posTerminalsRepository,
      zonesRepository,
      posTerminalZonesRepository,
    );
  });

  it('cria vínculo PRIMARY quando terminal e zone existem no tenant', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);
    const zone = pushZone();

    const { terminalZone } = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      zoneId: zone.id.toString(),
      tier: 'PRIMARY',
      assignedByUserId: adminUserId,
    });

    expect(terminalZone).toBeInstanceOf(PosTerminalZone);
    expect(terminalZone.terminalId.toString()).toBe(terminal.id.toString());
    expect(terminalZone.zoneId.toString()).toBe(zone.id.toString());
    expect(terminalZone.tier.value).toBe('PRIMARY');
    expect(terminalZone.tenantId).toBe(tenantId);
    expect(posTerminalZonesRepository.items).toHaveLength(1);
  });

  it('cria vínculo SECONDARY quando solicitado', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);
    const zone = pushZone();

    const { terminalZone } = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      zoneId: zone.id.toString(),
      tier: 'SECONDARY',
      assignedByUserId: adminUserId,
    });

    expect(terminalZone.tier.value).toBe('SECONDARY');
  });

  it('atualiza tier quando vínculo já existe (idempotente — sem duplicata)', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);
    const zone = pushZone();

    const existingLink = PosTerminalZone.create({
      terminalId: terminal.id,
      zoneId: zone.id,
      tier: PosZoneTier.PRIMARY(),
      tenantId,
    });
    posTerminalZonesRepository.items.push(existingLink);

    const { terminalZone } = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      zoneId: zone.id.toString(),
      tier: 'SECONDARY',
      assignedByUserId: adminUserId,
    });

    expect(terminalZone.id.toString()).toBe(existingLink.id.toString());
    expect(terminalZone.tier.value).toBe('SECONDARY');
    expect(posTerminalZonesRepository.items).toHaveLength(1);
  });

  it('lança ResourceNotFoundError quando terminal não existe no tenant', async () => {
    const zone = pushZone();
    const missingTerminalId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        terminalId: missingTerminalId,
        zoneId: zone.id.toString(),
        tier: 'PRIMARY',
        assignedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('lança ResourceNotFoundError quando zone não existe no tenant', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);
    const missingZoneId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        terminalId: terminal.id.toString(),
        zoneId: missingZoneId,
        tier: 'PRIMARY',
        assignedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('lança ResourceNotFoundError quando zone pertence a outro tenant (isolation)', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);
    const otherTenantId = new UniqueEntityID().toString();
    const foreignZone = pushZone(otherTenantId);

    await expect(
      sut.execute({
        tenantId,
        terminalId: terminal.id.toString(),
        zoneId: foreignZone.id.toString(),
        tier: 'PRIMARY',
        assignedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
