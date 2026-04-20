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
  RotateQrTokensBulkUseCase,
  type RotateQrTokensBulkRequest,
} from './rotate-qr-tokens-bulk';

const { addJobMock } = vi.hoisted(() => ({ addJobMock: vi.fn() }));

vi.mock('@/lib/queue', () => ({
  QUEUE_NAMES: {
    QR_BATCH: 'qr-batch-operations',
    BADGE_PDF: 'badge-pdf-generation',
  },
  addJob: addJobMock,
}));

describe('RotateQrTokensBulkUseCase', () => {
  let repo: InMemoryEmployeesRepository;
  let sut: RotateQrTokensBulkUseCase;
  const tenantId = new UniqueEntityID().toString();
  let cpfCounter = 0;

  beforeEach(() => {
    addJobMock.mockClear();
    addJobMock.mockResolvedValue({ id: 'fake-job' });
    repo = new InMemoryEmployeesRepository();
    sut = new RotateQrTokensBulkUseCase(repo);
    cpfCounter = 0;
  });

  function validCpf(seed: number): string {
    const n = Array.from(
      { length: 9 },
      (_, i) => Math.floor(Math.random() * 10) + (i === 0 ? seed % 10 : 0),
    ).map((v) => v % 10);
    const n1 = n[0],
      n2 = n[1],
      n3 = n[2],
      n4 = n[3],
      n5 = n[4],
      n6 = n[5],
      n7 = n[6],
      n8 = n[7],
      n9 = n[8];
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

  it('scope=ALL resolves every non-terminated employee and enqueues a single job', async () => {
    const a = await seedEmployee();
    const b = await seedEmployee();
    // terminated + other-tenant MUST be excluded
    await seedEmployee({ terminated: true });
    await seedEmployee({
      tenantId: new UniqueEntityID().toString(),
    });

    const input: RotateQrTokensBulkRequest = {
      tenantId,
      scope: 'ALL',
      generatePdfs: false,
      invokedByUserId: 'admin-01',
    };
    const result = await sut.execute(input);

    expect(result.total).toBe(2);
    expect(result.jobId).toEqual(expect.any(String));
    expect(addJobMock).toHaveBeenCalledTimes(1);
    const [queueName, payload, opts] = addJobMock.mock.calls[0];
    expect(queueName).toBe('qr-batch-operations');
    expect(payload.tenantId).toBe(tenantId);
    expect(payload.employeeIds.sort()).toEqual(
      [a.id.toString(), b.id.toString()].sort(),
    );
    expect(payload.generatePdfs).toBe(false);
    expect(payload.invokedByUserId).toBe('admin-01');
    expect(opts.jobId).toBe(result.jobId);
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
      generatePdfs: false,
      invokedByUserId: 'admin-01',
    });

    expect(result.total).toBe(1);
    const payload = addJobMock.mock.calls[0][1];
    expect(payload.employeeIds).toEqual([a.id.toString()]);
  });

  it('scope=CUSTOM uses the provided employeeIds, dropping ones not in tenant', async () => {
    const a = await seedEmployee();
    const b = await seedEmployee();
    const otherTenantEmp = await seedEmployee({
      tenantId: new UniqueEntityID().toString(),
    });

    const result = await sut.execute({
      tenantId,
      scope: 'CUSTOM',
      employeeIds: [
        a.id.toString(),
        b.id.toString(),
        otherTenantEmp.id.toString(),
      ],
      generatePdfs: false,
      invokedByUserId: 'admin-01',
    });

    expect(result.total).toBe(2);
    const payload = addJobMock.mock.calls[0][1];
    expect(payload.employeeIds.sort()).toEqual(
      [a.id.toString(), b.id.toString()].sort(),
    );
  });

  it('returns { jobId: null, total: 0 } without enqueueing when scope resolves to no employees', async () => {
    const result = await sut.execute({
      tenantId,
      scope: 'ALL',
      generatePdfs: true,
      invokedByUserId: 'admin-01',
    });
    expect(result.jobId).toBeNull();
    expect(result.total).toBe(0);
    expect(result.generatePdfs).toBe(true);
    expect(addJobMock).not.toHaveBeenCalled();
  });

  it('jobId is deterministic over { tenantId, scope, sorted(employeeIds) }', async () => {
    const a = await seedEmployee();
    const b = await seedEmployee();

    const first = await sut.execute({
      tenantId,
      scope: 'CUSTOM',
      employeeIds: [a.id.toString(), b.id.toString()],
      generatePdfs: false,
      invokedByUserId: 'admin-01',
    });
    addJobMock.mockClear();
    // Same tenant + scope + employeeIds (swapped order) → same jobId
    const second = await sut.execute({
      tenantId,
      scope: 'CUSTOM',
      employeeIds: [b.id.toString(), a.id.toString()],
      generatePdfs: false,
      invokedByUserId: 'admin-02',
    });
    expect(second.jobId).toBe(first.jobId);

    // The deterministic jobId is derived from sha256(tenantId|scope|ids)
    // Sanity-check by recomputing.
    const sortedIds = [a.id.toString(), b.id.toString()].sort().join(',');
    const expectedPrefix = createHash('sha256')
      .update(`${tenantId}|CUSTOM|${sortedIds}`)
      .digest('hex')
      .slice(0, 16);
    expect(first.jobId).toBe(expectedPrefix);
  });

  it('forwards generatePdfs=true in the enqueued job payload', async () => {
    await seedEmployee();
    await sut.execute({
      tenantId,
      scope: 'ALL',
      generatePdfs: true,
      invokedByUserId: 'admin-01',
    });
    const payload = addJobMock.mock.calls[0][1];
    expect(payload.generatePdfs).toBe(true);
  });
});
