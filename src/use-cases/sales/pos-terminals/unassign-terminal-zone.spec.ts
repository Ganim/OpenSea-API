import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTerminalZone } from '@/entities/sales/pos-terminal-zone';
import { PosZoneTier } from '@/entities/sales/value-objects/pos-zone-tier';
import { InMemoryPosTerminalZonesRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminal-zones-repository';

import { UnassignTerminalZoneUseCase } from './unassign-terminal-zone';

let posTerminalZonesRepository: InMemoryPosTerminalZonesRepository;
let sut: UnassignTerminalZoneUseCase;

const tenantId = new UniqueEntityID().toString();
const adminUserId = new UniqueEntityID().toString();

describe('Unassign POS Terminal Zone Use Case', () => {
  beforeEach(() => {
    posTerminalZonesRepository = new InMemoryPosTerminalZonesRepository();
    sut = new UnassignTerminalZoneUseCase(posTerminalZonesRepository);
  });

  it('remove vínculo existente entre terminal e zone', async () => {
    const terminalId = new UniqueEntityID();
    const zoneId = new UniqueEntityID();
    const link = PosTerminalZone.create({
      terminalId,
      zoneId,
      tier: PosZoneTier.PRIMARY(),
      tenantId,
    });
    posTerminalZonesRepository.items.push(link);

    await sut.execute({
      tenantId,
      terminalId: terminalId.toString(),
      zoneId: zoneId.toString(),
      unassignedByUserId: adminUserId,
    });

    expect(posTerminalZonesRepository.items).toHaveLength(0);
  });

  it('lança ResourceNotFoundError quando vínculo não existe', async () => {
    const missingTerminalId = new UniqueEntityID().toString();
    const missingZoneId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        terminalId: missingTerminalId,
        zoneId: missingZoneId,
        unassignedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('não remove vínculo pertencente a outro tenant (isolation)', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    const terminalId = new UniqueEntityID();
    const zoneId = new UniqueEntityID();
    const foreignLink = PosTerminalZone.create({
      terminalId,
      zoneId,
      tier: PosZoneTier.PRIMARY(),
      tenantId: otherTenantId,
    });
    posTerminalZonesRepository.items.push(foreignLink);

    await expect(
      sut.execute({
        tenantId,
        terminalId: terminalId.toString(),
        zoneId: zoneId.toString(),
        unassignedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    expect(posTerminalZonesRepository.items).toHaveLength(1);
  });
});
