import { beforeEach, describe, expect, it } from 'vitest';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchApproval } from '@/entities/hr/punch-approval';
import { InMemoryPunchApprovalsRepository } from './in-memory-punch-approvals-repository';

let repo: InMemoryPunchApprovalsRepository;
let tenantId: string;

function makeApproval(
  overrides: {
    tenantId?: string;
    timeEntryId?: string;
    employeeId?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt?: Date;
  } = {},
) {
  return PunchApproval.create({
    tenantId: new UniqueEntityID(overrides.tenantId ?? tenantId),
    timeEntryId: new UniqueEntityID(overrides.timeEntryId),
    employeeId: new UniqueEntityID(overrides.employeeId),
    reason: 'OUT_OF_GEOFENCE',
    status: overrides.status ?? 'PENDING',
    createdAt: overrides.createdAt,
  });
}

describe('InMemoryPunchApprovalsRepository', () => {
  beforeEach(() => {
    repo = new InMemoryPunchApprovalsRepository();
    tenantId = new UniqueEntityID().toString();
  });

  it('create adiciona aprovação no items', async () => {
    const approval = makeApproval();
    await repo.create(approval);
    expect(repo.items).toHaveLength(1);
    expect(repo.items[0].id.toString()).toBe(approval.id.toString());
  });

  it('findById retorna apenas aprovação do tenant informado', async () => {
    const approval = makeApproval();
    await repo.create(approval);

    const found = await repo.findById(approval.id, tenantId);
    expect(found).not.toBeNull();
    expect(found?.id.toString()).toBe(approval.id.toString());

    const otherTenantResult = await repo.findById(
      approval.id,
      new UniqueEntityID().toString(),
    );
    expect(otherTenantResult).toBeNull();
  });

  it('findByTimeEntryId retorna a aprovação 1:1 da batida', async () => {
    const timeEntryId = new UniqueEntityID().toString();
    const approval = makeApproval({ timeEntryId });
    await repo.create(approval);

    const found = await repo.findByTimeEntryId(
      new UniqueEntityID(timeEntryId),
      tenantId,
    );
    expect(found?.timeEntryId.toString()).toBe(timeEntryId);
  });

  it('findManyByTenantId com filter status PENDING retorna só as pendentes', async () => {
    const pending = makeApproval({ status: 'PENDING' });
    const approved = makeApproval({ status: 'APPROVED' });
    const rejected = makeApproval({ status: 'REJECTED' });
    await repo.create(pending);
    await repo.create(approved);
    await repo.create(rejected);

    const result = await repo.findManyByTenantId(tenantId, {
      status: 'PENDING',
    });

    expect(result.total).toBe(1);
    expect(result.items[0].status).toBe('PENDING');
  });

  it('findManyByTenantId com filter employeeId + status retorna só os matches', async () => {
    const targetEmployee = new UniqueEntityID().toString();
    const otherEmployee = new UniqueEntityID().toString();

    await repo.create(
      makeApproval({ employeeId: targetEmployee, status: 'PENDING' }),
    );
    await repo.create(
      makeApproval({ employeeId: targetEmployee, status: 'APPROVED' }),
    );
    await repo.create(
      makeApproval({ employeeId: otherEmployee, status: 'PENDING' }),
    );

    const result = await repo.findManyByTenantId(tenantId, {
      status: 'PENDING',
      employeeId: targetEmployee,
    });

    expect(result.total).toBe(1);
    expect(result.items[0].employeeId.toString()).toBe(targetEmployee);
    expect(result.items[0].status).toBe('PENDING');
  });

  it('save substitui por id', async () => {
    const approval = makeApproval();
    await repo.create(approval);

    approval.resolve('user-01', 'nota');
    await repo.save(approval);

    expect(repo.items).toHaveLength(1);
    expect(repo.items[0].status).toBe('APPROVED');
    expect(repo.items[0].resolverNote).toBe('nota');
  });

  it('isola tenants na findManyByTenantId', async () => {
    const otherTenant = new UniqueEntityID().toString();
    await repo.create(makeApproval());
    await repo.create(makeApproval({ tenantId: otherTenant }));

    const mine = await repo.findManyByTenantId(tenantId);
    const theirs = await repo.findManyByTenantId(otherTenant);

    expect(mine.total).toBe(1);
    expect(theirs.total).toBe(1);
    expect(mine.items[0].tenantId.toString()).toBe(tenantId);
    expect(theirs.items[0].tenantId.toString()).toBe(otherTenant);
  });

  it('findManyByTenantId ordena desc por createdAt e pagina por page/pageSize', async () => {
    for (let i = 0; i < 5; i++) {
      await repo.create(makeApproval({ createdAt: new Date(2026, 3, 10 + i) }));
    }

    const page1 = await repo.findManyByTenantId(tenantId, {
      page: 1,
      pageSize: 2,
    });
    const page2 = await repo.findManyByTenantId(tenantId, {
      page: 2,
      pageSize: 2,
    });

    expect(page1.total).toBe(5);
    expect(page1.items).toHaveLength(2);
    expect(page2.items).toHaveLength(2);
    // Mais recentes vêm primeiro
    expect(page1.items[0].createdAt.getTime()).toBeGreaterThan(
      page1.items[1].createdAt.getTime(),
    );
  });
});
