import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchMissedLog } from '@/entities/hr/punch-missed-log';

import { InMemoryPunchMissedLogRepository } from './in-memory-punch-missed-log-repository';

let repo: InMemoryPunchMissedLogRepository;
let tenantId: string;

function utcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

async function seedLog(
  tenantIdArg: string,
  employeeIdArg: string,
  dateIso: string,
): Promise<PunchMissedLog> {
  const log = PunchMissedLog.create({
    tenantId: new UniqueEntityID(tenantIdArg),
    employeeId: new UniqueEntityID(employeeIdArg),
    date: utcDate(dateIso),
  });
  await repo.create(log);
  return log;
}

describe('InMemoryPunchMissedLogRepository', () => {
  beforeEach(() => {
    repo = new InMemoryPunchMissedLogRepository();
    tenantId = new UniqueEntityID().toString();
  });

  it('create + findById retorna o log persistido respeitando tenant', async () => {
    const employeeId = new UniqueEntityID().toString();
    const log = await seedLog(tenantId, employeeId, '2026-04-20');

    const found = await repo.findById(log.id, tenantId);
    expect(found).not.toBeNull();
    expect(found?.employeeId.toString()).toBe(employeeId);
    expect(found?.date.toISOString()).toBe('2026-04-20T00:00:00.000Z');

    // Outro tenant não enxerga.
    const otherTenant = new UniqueEntityID().toString();
    const leak = await repo.findById(log.id, otherTenant);
    expect(leak).toBeNull();
  });

  it('findUniqueByTenantEmployeeDate retorna match exato', async () => {
    const employeeId = new UniqueEntityID().toString();
    await seedLog(tenantId, employeeId, '2026-04-21');

    const match = await repo.findUniqueByTenantEmployeeDate(
      tenantId,
      employeeId,
      utcDate('2026-04-21'),
    );
    expect(match).not.toBeNull();
    expect(match?.employeeId.toString()).toBe(employeeId);
  });

  it('findUniqueByTenantEmployeeDate retorna null quando nenhum log casa (tenant/employee/date diferentes)', async () => {
    const employeeId = new UniqueEntityID().toString();
    await seedLog(tenantId, employeeId, '2026-04-22');

    const otherEmployee = new UniqueEntityID().toString();
    const noMatchEmployee = await repo.findUniqueByTenantEmployeeDate(
      tenantId,
      otherEmployee,
      utcDate('2026-04-22'),
    );
    expect(noMatchEmployee).toBeNull();

    const noMatchDate = await repo.findUniqueByTenantEmployeeDate(
      tenantId,
      employeeId,
      utcDate('2026-04-23'),
    );
    expect(noMatchDate).toBeNull();

    const otherTenant = new UniqueEntityID().toString();
    const noMatchTenant = await repo.findUniqueByTenantEmployeeDate(
      otherTenant,
      employeeId,
      utcDate('2026-04-22'),
    );
    expect(noMatchTenant).toBeNull();
  });

  it('findManyByTenant retorna vazio quando não há logs no tenant', async () => {
    const result = await repo.findManyByTenant(tenantId);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('findManyByTenant filtra por dateStart/dateEnd e employeeIds', async () => {
    const empA = new UniqueEntityID().toString();
    const empB = new UniqueEntityID().toString();
    await seedLog(tenantId, empA, '2026-04-20');
    await seedLog(tenantId, empA, '2026-04-22');
    await seedLog(tenantId, empB, '2026-04-22');
    await seedLog(tenantId, empB, '2026-04-25');

    const byRange = await repo.findManyByTenant(tenantId, {
      dateStart: utcDate('2026-04-21'),
      dateEnd: utcDate('2026-04-23'),
    });
    expect(byRange.total).toBe(2);
    expect(
      byRange.items.every(
        (it) =>
          it.date.getTime() >= utcDate('2026-04-21').getTime() &&
          it.date.getTime() <= utcDate('2026-04-23').getTime(),
      ),
    ).toBe(true);

    const byEmployee = await repo.findManyByTenant(tenantId, {
      employeeIds: [empA],
    });
    expect(byEmployee.total).toBe(2);
    expect(
      byEmployee.items.every((it) => it.employeeId.toString() === empA),
    ).toBe(true);
  });

  it('findManyByTenant pagina por page/pageSize', async () => {
    const empA = new UniqueEntityID().toString();
    for (let i = 0; i < 5; i++) {
      await seedLog(tenantId, empA, `2026-04-${10 + i}`);
    }

    const page1 = await repo.findManyByTenant(tenantId, {
      page: 1,
      pageSize: 2,
    });
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(5);

    const page2 = await repo.findManyByTenant(tenantId, {
      page: 2,
      pageSize: 2,
    });
    expect(page2.items).toHaveLength(2);

    const page3 = await repo.findManyByTenant(tenantId, {
      page: 3,
      pageSize: 2,
    });
    expect(page3.items).toHaveLength(1);
  });
});
