import { beforeEach, describe, expect, it } from 'vitest';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchApproval } from '@/entities/hr/punch-approval';
import { InMemoryPunchApprovalsRepository } from '@/repositories/hr/in-memory/in-memory-punch-approvals-repository';
import { ListPunchApprovalsUseCase } from './list-punch-approvals';

let repo: InMemoryPunchApprovalsRepository;
let sut: ListPunchApprovalsUseCase;
let tenantId: string;

function seed(
  overrides: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    employeeId?: string;
    createdAt?: Date;
  } = {},
) {
  return PunchApproval.create({
    tenantId: new UniqueEntityID(tenantId),
    timeEntryId: new UniqueEntityID(),
    employeeId: new UniqueEntityID(overrides.employeeId),
    reason: 'OUT_OF_GEOFENCE',
    status: overrides.status ?? 'PENDING',
    createdAt: overrides.createdAt,
  });
}

describe('ListPunchApprovalsUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryPunchApprovalsRepository();
    sut = new ListPunchApprovalsUseCase(repo);
    tenantId = new UniqueEntityID().toString();
  });

  it('retorna items mapeados para DTO + total + page + pageSize', async () => {
    await repo.create(seed());
    const result = await sut.execute({ tenantId });

    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toHaveProperty('id');
    expect(result.items[0]).toHaveProperty('status');
    expect(result.items[0]).toHaveProperty('reason');
    expect(result.items[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('filtra por status PENDING (usado pelo gestor no dashboard)', async () => {
    await repo.create(seed({ status: 'PENDING' }));
    await repo.create(seed({ status: 'APPROVED' }));

    const result = await sut.execute({ tenantId, status: 'PENDING' });

    expect(result.total).toBe(1);
    expect(result.items[0].status).toBe('PENDING');
  });

  it('filtra por employeeId (funcionário vendo só suas próprias aprovações)', async () => {
    const myEmployeeId = new UniqueEntityID().toString();
    const otherEmployeeId = new UniqueEntityID().toString();

    await repo.create(seed({ employeeId: myEmployeeId }));
    await repo.create(seed({ employeeId: myEmployeeId }));
    await repo.create(seed({ employeeId: otherEmployeeId }));

    const result = await sut.execute({ tenantId, employeeId: myEmployeeId });

    expect(result.total).toBe(2);
    expect(result.items.every((it) => it.employeeId === myEmployeeId)).toBe(
      true,
    );
  });

  it('filtra por employeeId + status combinados', async () => {
    const myEmployeeId = new UniqueEntityID().toString();
    await repo.create(seed({ employeeId: myEmployeeId, status: 'PENDING' }));
    await repo.create(seed({ employeeId: myEmployeeId, status: 'APPROVED' }));

    const result = await sut.execute({
      tenantId,
      employeeId: myEmployeeId,
      status: 'PENDING',
    });

    expect(result.total).toBe(1);
    expect(result.items[0].status).toBe('PENDING');
  });

  it('paginação: page=2 pageSize=2 retorna items 3-4 de 5 totais', async () => {
    for (let i = 0; i < 5; i++) {
      await repo.create(seed({ createdAt: new Date(2026, 3, 10 + i) }));
    }

    const result = await sut.execute({ tenantId, page: 2, pageSize: 2 });

    expect(result.total).toBe(5);
    expect(result.items).toHaveLength(2);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(2);
  });

  it('isola tenants (não retorna aprovações de outros tenants)', async () => {
    const otherTenant = new UniqueEntityID().toString();
    await repo.create(seed());
    await repo.create(
      PunchApproval.create({
        tenantId: new UniqueEntityID(otherTenant),
        timeEntryId: new UniqueEntityID(),
        employeeId: new UniqueEntityID(),
        reason: 'OUT_OF_GEOFENCE',
      }),
    );

    const result = await sut.execute({ tenantId });

    expect(result.total).toBe(1);
    expect(result.items[0].tenantId).toBe(tenantId);
  });
});
