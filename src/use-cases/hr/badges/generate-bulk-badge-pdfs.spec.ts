import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';

import {
  GenerateBulkBadgePdfsUseCase,
  type GenerateBulkBadgePdfsRequest,
} from './generate-bulk-badge-pdfs';

const { addJobMock } = vi.hoisted(() => ({ addJobMock: vi.fn() }));

vi.mock('@/lib/queue', () => ({
  QUEUE_NAMES: {
    QR_BATCH: 'qr-batch-operations',
    BADGE_PDF: 'badge-pdf-generation',
  },
  addJob: addJobMock,
}));

/**
 * Unit tests for the bulk crachá PDF use case (Plan 05-06 Task 2).
 *
 * Mirrors the shape of `rotate-qr-tokens-bulk.spec.ts` because both use
 * cases share the `scope` resolution branch. The BullMQ queue is mocked
 * via `vi.hoisted` + `vi.mock` so nothing touches Redis during unit runs.
 */
describe('GenerateBulkBadgePdfsUseCase', () => {
  let repo: InMemoryEmployeesRepository;
  let sut: GenerateBulkBadgePdfsUseCase;
  const tenantId = new UniqueEntityID().toString();
  let cpfCounter = 0;

  beforeEach(() => {
    addJobMock.mockClear();
    addJobMock.mockResolvedValue({ id: 'fake-job' });
    repo = new InMemoryEmployeesRepository();
    sut = new GenerateBulkBadgePdfsUseCase(repo);
    cpfCounter = 0;
  });

  // Copy of the CPF generator used by rotate-qr-tokens-bulk.spec.ts so the
  // `CPF.create` value-object validator accepts our seeded inputs.
  function validCpf(seed: number): string {
    const n = Array.from(
      { length: 9 },
      (_, i) => Math.floor(Math.random() * 10) + (i === 0 ? seed % 10 : 0),
    ).map((v) => v % 10);
    const [n1, n2, n3, n4, n5, n6, n7, n8, n9] = n;
    let d1 =
      n9 * 2 +
      n8 * 3 +
      n7 * 4 +
      n6 * 5 +
      n5 * 6 +
      n4 * 7 +
      n3 * 8 +
      n2 * 9 +
      n1 * 10;
    d1 = 11 - (d1 % 11);
    if (d1 >= 10) d1 = 0;
    let d2 =
      d1 * 2 +
      n9 * 3 +
      n8 * 4 +
      n7 * 5 +
      n6 * 6 +
      n5 * 7 +
      n4 * 8 +
      n3 * 9 +
      n2 * 10 +
      n1 * 11;
    d2 = 11 - (d2 % 11);
    if (d2 >= 10) d2 = 0;
    return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
  }

  async function seedEmployee(
    opts: {
      departmentId?: UniqueEntityID;
      tenantId?: string;
      terminated?: boolean;
    } = {},
  ) {
    return repo.create({
      tenantId: opts.tenantId ?? tenantId,
      registrationNumber: `EMP-${Math.random().toString(36).slice(2, 8)}`,
      fullName: 'João Silva',
      cpf: CPF.create(validCpf(cpfCounter++)),
      hireDate: new Date('2023-01-01'),
      status: opts.terminated
        ? EmployeeStatus.TERMINATED()
        : EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
      departmentId: opts.departmentId,
    });
  }

  it('scope=CUSTOM enqueues a BADGE_PDF job with rotateTokens=true and returns { jobId, total }', async () => {
    const a = await seedEmployee();
    const b = await seedEmployee();
    const c = await seedEmployee();

    const input: GenerateBulkBadgePdfsRequest = {
      tenantId,
      scope: 'CUSTOM',
      employeeIds: [a.id.toString(), b.id.toString(), c.id.toString()],
      invokedByUserId: 'admin-01',
    };
    const result = await sut.execute(input);

    expect(result.total).toBe(3);
    expect(result.jobId).toEqual(expect.any(String));

    expect(addJobMock).toHaveBeenCalledTimes(1);
    const [queueName, payload, opts] = addJobMock.mock.calls[0];
    expect(queueName).toBe('badge-pdf-generation');
    expect(payload.tenantId).toBe(tenantId);
    expect(payload.scope).toBe('CUSTOM');
    expect(payload.employeeIds.sort()).toEqual(
      [a.id.toString(), b.id.toString(), c.id.toString()].sort(),
    );
    expect(payload.invokedByUserId).toBe('admin-01');
    expect(payload.rotateTokens).toBe(true);
    expect(opts.jobId).toBe(result.jobId);
  });

  it('scope=ALL resolves every non-terminated employee of the tenant', async () => {
    const a = await seedEmployee();
    const b = await seedEmployee();
    // terminated + other-tenant MUST be excluded
    await seedEmployee({ terminated: true });
    await seedEmployee({ tenantId: new UniqueEntityID().toString() });

    const result = await sut.execute({
      tenantId,
      scope: 'ALL',
      invokedByUserId: 'admin-01',
    });

    expect(result.total).toBe(2);
    const payload = addJobMock.mock.calls[0][1];
    expect(payload.employeeIds.sort()).toEqual(
      [a.id.toString(), b.id.toString()].sort(),
    );
  });

  it('scope=DEPARTMENT filters by department ids', async () => {
    const dept1 = new UniqueEntityID();
    const dept2 = new UniqueEntityID();
    const a = await seedEmployee({ departmentId: dept1 });
    await seedEmployee({ departmentId: dept2 });
    await seedEmployee();

    const result = await sut.execute({
      tenantId,
      scope: 'DEPARTMENT',
      departmentIds: [dept1.toString()],
      invokedByUserId: 'admin-01',
    });

    expect(result.total).toBe(1);
    const payload = addJobMock.mock.calls[0][1];
    expect(payload.employeeIds).toEqual([a.id.toString()]);
  });

  it('returns { jobId: null, total: 0 } without enqueueing when scope resolves to no employees', async () => {
    const result = await sut.execute({
      tenantId,
      scope: 'ALL',
      invokedByUserId: 'admin-01',
    });
    expect(result.jobId).toBeNull();
    expect(result.total).toBe(0);
    expect(addJobMock).not.toHaveBeenCalled();
  });

  it('drops employeeIds that do not belong to the tenant (cross-tenant guard)', async () => {
    const a = await seedEmployee();
    const otherTenantEmp = await seedEmployee({
      tenantId: new UniqueEntityID().toString(),
    });

    const result = await sut.execute({
      tenantId,
      scope: 'CUSTOM',
      employeeIds: [a.id.toString(), otherTenantEmp.id.toString()],
      invokedByUserId: 'admin-01',
    });

    expect(result.total).toBe(1);
    const payload = addJobMock.mock.calls[0][1];
    expect(payload.employeeIds).toEqual([a.id.toString()]);
  });

  it('deterministic jobId derived from sha256(tenantId|badge-pdf|sorted(ids))', async () => {
    const a = await seedEmployee();
    const b = await seedEmployee();

    const first = await sut.execute({
      tenantId,
      scope: 'CUSTOM',
      employeeIds: [a.id.toString(), b.id.toString()],
      invokedByUserId: 'admin-01',
    });
    addJobMock.mockClear();
    // Same tenant + ids (swapped order) → same jobId.
    const second = await sut.execute({
      tenantId,
      scope: 'CUSTOM',
      employeeIds: [b.id.toString(), a.id.toString()],
      invokedByUserId: 'admin-02',
    });
    expect(second.jobId).toBe(first.jobId);

    const sortedIds = [a.id.toString(), b.id.toString()].sort().join(',');
    const expected = createHash('sha256')
      .update(`${tenantId}|badge-pdf|${sortedIds}`)
      .digest('hex')
      .slice(0, 16);
    expect(first.jobId).toBe(expected);
  });
});
