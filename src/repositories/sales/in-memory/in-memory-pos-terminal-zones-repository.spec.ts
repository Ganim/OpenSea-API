import { describe, it, expect } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTerminalZone } from '@/entities/sales/pos-terminal-zone';
import { PosZoneTier } from '@/entities/sales/value-objects/pos-zone-tier';

import { InMemoryPosTerminalZonesRepository } from './in-memory-pos-terminal-zones-repository';

describe('InMemoryPosTerminalZonesRepository', () => {
  it('compiles and instantiates', async () => {
    const repo = new InMemoryPosTerminalZonesRepository();
    expect(repo.items).toEqual([]);
  });

  it('creates and finds a terminal zone by id', async () => {
    const repo = new InMemoryPosTerminalZonesRepository();
    const terminalId = new UniqueEntityID();
    const zoneId = new UniqueEntityID();
    const zone = PosTerminalZone.create({
      terminalId,
      zoneId,
      tier: PosZoneTier.PRIMARY(),
      tenantId: 'tenant-1',
    });

    await repo.create(zone);

    const found = await repo.findById(zone.id, 'tenant-1');
    expect(found?.id.toString()).toBe(zone.id.toString());

    const byTerminal = await repo.findByTerminalId(terminalId, 'tenant-1');
    expect(byTerminal).toHaveLength(1);

    const byPair = await repo.findByTerminalAndZone(
      terminalId,
      zoneId,
      'tenant-1',
    );
    expect(byPair?.id.toString()).toBe(zone.id.toString());

    await repo.remove(zone.id);
    expect(repo.items).toHaveLength(0);
  });
});
