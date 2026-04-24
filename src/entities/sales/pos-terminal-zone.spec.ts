import { describe, expect, it } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

import { PosTerminalZone } from './pos-terminal-zone';
import { PosZoneTier } from './value-objects/pos-zone-tier';

describe('PosTerminalZone entity', () => {
  it('cria com tier PRIMARY por padrão', () => {
    const z = PosTerminalZone.create({
      terminalId: new UniqueEntityID('term-1'),
      zoneId: new UniqueEntityID('zone-1'),
      tenantId: 'tenant-1',
    });
    expect(z.tier.value).toBe('PRIMARY');
  });

  it('permite tier SECONDARY', () => {
    const z = PosTerminalZone.create({
      terminalId: new UniqueEntityID('term-1'),
      zoneId: new UniqueEntityID('zone-1'),
      tier: PosZoneTier.SECONDARY(),
      tenantId: 'tenant-1',
    });
    expect(z.tier.value).toBe('SECONDARY');
  });

  it('preserva terminalId e zoneId', () => {
    const z = PosTerminalZone.create({
      terminalId: new UniqueEntityID('term-x'),
      zoneId: new UniqueEntityID('zone-y'),
      tenantId: 't1',
    });
    expect(z.terminalId.toString()).toBe('term-x');
    expect(z.zoneId.toString()).toBe('zone-y');
  });

  it('expõe tenantId escalar', () => {
    const z = PosTerminalZone.create({
      terminalId: new UniqueEntityID('term-1'),
      zoneId: new UniqueEntityID('zone-1'),
      tenantId: 'tenant-42',
    });
    expect(z.tenantId).toBe('tenant-42');
  });

  it('aceita id explícito', () => {
    const explicitId = new UniqueEntityID('explicit-id');
    const z = PosTerminalZone.create(
      {
        terminalId: new UniqueEntityID('t'),
        zoneId: new UniqueEntityID('z'),
        tenantId: 'tenant',
      },
      explicitId,
    );
    expect(z.id.toString()).toBe('explicit-id');
  });
});
