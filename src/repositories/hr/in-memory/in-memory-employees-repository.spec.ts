import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';

describe('InMemoryEmployeesRepository', () => {
  let repository: InMemoryEmployeesRepository;
  const tenantId = new UniqueEntityID().toString();

  beforeEach(() => {
    repository = new InMemoryEmployeesRepository();
  });

  it('should create an employee', async () => {
    const cpf = CPF.create('52998224725');
    const employeeData = {
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    };

    const employee = await repository.create(employeeData);

    expect(employee).toBeInstanceOf(Employee);
    expect(employee.registrationNumber).toBe('EMP001');
    expect(employee.fullName).toBe('João Silva');
    expect(employee.cpf.equals(cpf)).toBe(true);
    expect(employee.status.value).toBe('ACTIVE');
  });

  it('should find employee by id', async () => {
    const cpf = CPF.create('52998224725');
    const employeeData = {
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    };

    const createdEmployee = await repository.create(employeeData);
    const foundEmployee = await repository.findById(
      createdEmployee.id,
      tenantId,
    );

    expect(foundEmployee).toBeDefined();
    expect(foundEmployee?.id.equals(createdEmployee.id)).toBe(true);
  });

  it('should find employee by registration number', async () => {
    const cpf = CPF.create('52998224725');
    const employeeData = {
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    };

    await repository.create(employeeData);
    const foundEmployee = await repository.findByRegistrationNumber(
      'EMP001',
      tenantId,
    );

    expect(foundEmployee).toBeDefined();
    expect(foundEmployee?.registrationNumber).toBe('EMP001');
  });

  it('should find employee by CPF', async () => {
    const cpf = CPF.create('52998224725');
    const employeeData = {
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    };

    await repository.create(employeeData);
    const foundEmployee = await repository.findByCpf(cpf, tenantId);

    expect(foundEmployee).toBeDefined();
    expect(foundEmployee?.cpf.equals(cpf)).toBe(true);
  });

  it('should return null when employee not found', async () => {
    const nonExistentId = new UniqueEntityID();
    const result = await repository.findById(nonExistentId, tenantId);

    expect(result).toBeNull();
  });

  it('should find many employees', async () => {
    const cpf1 = CPF.create('52998224725');
    const cpf2 = CPF.create('12345678909');

    await repository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: cpf1,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    });

    await repository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Maria Santos',
      cpf: cpf2,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3500,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    });

    const employees = await repository.findMany(tenantId);

    expect(employees).toHaveLength(2);
    expect(employees[0].fullName).toBe('João Silva');
    expect(employees[1].fullName).toBe('Maria Santos');
  });

  it('should find active employees', async () => {
    const cpf1 = CPF.create('52998224725');
    const cpf2 = CPF.create('12345678909');

    await repository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: cpf1,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    });

    await repository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Maria Santos',
      cpf: cpf2,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.TERMINATED(),
      baseSalary: 3500,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    });

    const activeEmployees = await repository.findManyActive(tenantId);

    expect(activeEmployees).toHaveLength(1);
    expect(activeEmployees[0].fullName).toBe('João Silva');
  });

  it('should update employee', async () => {
    const cpf = CPF.create('52998224725');
    const employeeData = {
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    };

    const createdEmployee = await repository.create(employeeData);

    const updatedEmployee = await repository.update({
      id: createdEmployee.id,
      fullName: 'João Silva Santos',
      baseSalary: 3500,
    });

    expect(updatedEmployee).toBeDefined();
    expect(updatedEmployee?.fullName).toBe('João Silva Santos');
    expect(updatedEmployee?.baseSalary).toBe(3500);
  });

  it('should delete employee (soft delete)', async () => {
    const cpf = CPF.create('52998224725');
    const employeeData = {
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    };

    const createdEmployee = await repository.create(employeeData);

    await repository.delete(createdEmployee.id);

    const foundEmployee = await repository.findById(
      createdEmployee.id,
      tenantId,
    );
    expect(foundEmployee).toBeNull();

    // Employee should not appear in findMany
    const employees = await repository.findMany(tenantId);
    expect(employees).toHaveLength(0);
  });

  // ────────────────────────────────────────────────────────────────────────
  // Phase 5 — kiosk QR rotation (D-14 / D-15)
  // ────────────────────────────────────────────────────────────────────────

  describe('Phase 5 — QR rotation + crachás listing', () => {
    const otherTenantId = new UniqueEntityID().toString();
    let cpfCounter = 0;

    async function seed(
      overrides: Partial<{
        registrationNumber: string;
        fullName: string;
        cpfValue: string;
        tenantId: string;
        departmentId: UniqueEntityID;
        terminated: boolean;
      }> = {},
    ): Promise<Employee> {
      const cpfValue =
        overrides.cpfValue ?? generateValidCpfForSpec(cpfCounter++);
      const employee = await repository.create({
        tenantId: overrides.tenantId ?? tenantId,
        registrationNumber:
          overrides.registrationNumber ??
          `EMP-${Math.random().toString(36).slice(2, 8)}`,
        fullName: overrides.fullName ?? 'João Silva',
        cpf: CPF.create(cpfValue),
        hireDate: new Date('2023-01-01'),
        status: overrides.terminated
          ? EmployeeStatus.TERMINATED()
          : EmployeeStatus.ACTIVE(),
        baseSalary: 3000,
        contractType: ContractType.CLT(),
        workRegime: WorkRegime.FULL_TIME(),
        weeklyHours: 40,
        country: 'Brasil',
        departmentId: overrides.departmentId,
      });
      return employee;
    }

    describe('findByQrTokenHash', () => {
      it('returns the employee with the matching hash inside the tenant', async () => {
        const emp = await seed();
        await repository.rotateQrToken(emp.id.toString(), tenantId, 'hash-aaa');

        const found = await repository.findByQrTokenHash('hash-aaa', tenantId);
        expect(found).not.toBeNull();
        expect(found?.id.equals(emp.id)).toBe(true);
      });

      it('returns null when the matching employee is on another tenant (isolation)', async () => {
        const empOther = await seed({
          tenantId: otherTenantId,
        });
        await repository.rotateQrToken(
          empOther.id.toString(),
          otherTenantId,
          'hash-cross',
        );

        const found = await repository.findByQrTokenHash(
          'hash-cross',
          tenantId,
        );
        expect(found).toBeNull();
      });

      it('returns null when no employee has that hash', async () => {
        await seed();
        const found = await repository.findByQrTokenHash(
          'hash-does-not-exist',
          tenantId,
        );
        expect(found).toBeNull();
      });

      it('returns null for employees whose qrTokenHash is null (unrotated)', async () => {
        const emp = await seed();
        expect(emp.qrTokenHash).toBeNull();
        // No rotation has happened — a lookup by any hash must return null.
        const found = await repository.findByQrTokenHash('anything', tenantId);
        expect(found).toBeNull();
      });
    });

    describe('rotateQrToken', () => {
      it('updates qrTokenHash + qrTokenSetAt so the OLD hash no longer matches', async () => {
        const emp = await seed();
        await repository.rotateQrToken(emp.id.toString(), tenantId, 'hash-old');
        expect(emp.qrTokenHash).toBe('hash-old');
        expect(emp.qrTokenSetAt).toBeInstanceOf(Date);

        await repository.rotateQrToken(emp.id.toString(), tenantId, 'hash-new');
        expect(emp.qrTokenHash).toBe('hash-new');

        expect(
          await repository.findByQrTokenHash('hash-old', tenantId),
        ).toBeNull();
        const found = await repository.findByQrTokenHash('hash-new', tenantId);
        expect(found?.id.equals(emp.id)).toBe(true);
      });

      it('throws ResourceNotFoundError when the employee is not found', async () => {
        await expect(
          repository.rotateQrToken(
            '00000000-0000-0000-0000-000000000000',
            tenantId,
            'whatever',
          ),
        ).rejects.toBeInstanceOf(ResourceNotFoundError);
      });

      it('throws ResourceNotFoundError when the employee belongs to a different tenant (isolation)', async () => {
        const emp = await seed({
          tenantId: otherTenantId,
        });
        await expect(
          repository.rotateQrToken(emp.id.toString(), tenantId, 'any-hash'),
        ).rejects.toBeInstanceOf(ResourceNotFoundError);
      });
    });

    describe('rotateQrTokensBulk', () => {
      it('applies every update and returns the count of rotated rows', async () => {
        const a = await seed();
        const b = await seed();

        const count = await repository.rotateQrTokensBulk(
          [
            { employeeId: a.id.toString(), hash: 'h-a' },
            { employeeId: b.id.toString(), hash: 'h-b' },
          ],
          tenantId,
        );

        expect(count).toBe(2);
        expect(a.qrTokenHash).toBe('h-a');
        expect(b.qrTokenHash).toBe('h-b');
      });

      it('silently skips ids that belong to a different tenant', async () => {
        const a = await seed();
        const b = await seed({
          tenantId: otherTenantId,
        });

        const count = await repository.rotateQrTokensBulk(
          [
            { employeeId: a.id.toString(), hash: 'h-a' },
            { employeeId: b.id.toString(), hash: 'h-b' }, // wrong tenant
          ],
          tenantId,
        );

        expect(count).toBe(1);
        expect(a.qrTokenHash).toBe('h-a');
        // b untouched because it lives in otherTenantId
        expect(b.qrTokenHash).toBeNull();
      });
    });

    describe('findAllIds / findIdsByDepartments', () => {
      it('findAllIds returns only tenant-scoped, non-deleted, non-terminated employees', async () => {
        const a = await seed();
        await seed({
          tenantId: otherTenantId,
        });
        const terminated = await seed({
          terminated: true,
        });

        const ids = await repository.findAllIds(tenantId);
        expect(ids).toContain(a.id.toString());
        expect(ids).not.toContain(terminated.id.toString());
        // Other-tenant absent
        expect(ids).toHaveLength(1);
      });

      it('findIdsByDepartments filters to the supplied department ids', async () => {
        const dept1 = new UniqueEntityID();
        const dept2 = new UniqueEntityID();

        const a = await seed({ departmentId: dept1 });
        const b = await seed({ departmentId: dept2 });
        const c = await seed();

        const ids = await repository.findIdsByDepartments(
          [dept1.toString()],
          tenantId,
        );
        expect(ids).toContain(a.id.toString());
        expect(ids).not.toContain(b.id.toString());
        expect(ids).not.toContain(c.id.toString());
      });

      it('findIdsByDepartments returns [] when called with an empty list', async () => {
        await seed();
        const ids = await repository.findIdsByDepartments([], tenantId);
        expect(ids).toEqual([]);
      });
    });

    describe('findAllForCrachas', () => {
      it('returns tenant-scoped items with qrTokenSetAt and pagination metadata', async () => {
        const a = await seed({
          fullName: 'Ana Costa',
          registrationNumber: 'EMP-AAAA',
        });
        await repository.rotateQrToken(a.id.toString(), tenantId, 'hash-ana');
        await seed({
          fullName: 'Bruno Lima',
          registrationNumber: 'EMP-BBBB',
          tenantId: otherTenantId,
        });

        const result = await repository.findAllForCrachas(tenantId, {
          page: 1,
          pageSize: 50,
        });

        expect(result.total).toBe(1);
        expect(result.items).toHaveLength(1);
        expect(result.items[0].id).toBe(a.id.toString());
        expect(result.items[0].fullName).toBe('Ana Costa');
        expect(result.items[0].registration).toBe('EMP-AAAA');
        expect(result.items[0].qrTokenSetAt).toBeInstanceOf(Date);
      });

      it('filters by departmentId', async () => {
        const dept = new UniqueEntityID();
        const a = await seed({
          fullName: 'Ana Costa',
          departmentId: dept,
        });
        await seed({ fullName: 'Bruno Lima' });

        const result = await repository.findAllForCrachas(tenantId, {
          departmentId: dept.toString(),
          page: 1,
          pageSize: 50,
        });

        expect(result.total).toBe(1);
        expect(result.items[0].id).toBe(a.id.toString());
      });

      it('filters by rotationStatus=never / active / recent', async () => {
        const a = await seed({
          fullName: 'A-unrotated',
        });
        const b = await seed({
          fullName: 'B-recent',
        });
        await repository.rotateQrToken(
          b.id.toString(),
          tenantId,
          'hash-recent',
        );
        const c = await seed({
          fullName: 'C-old',
        });
        await repository.rotateQrToken(c.id.toString(), tenantId, 'hash-old');
        // Simulate an old rotation: push qrTokenSetAt back 60 days by re-reading
        // the entity's public getter and mutating via the repo's update()...
        // Simpler: poke the entity's props via the domain method (not exposed),
        // so we use a cast.
        (
          c as unknown as { props: { qrTokenSetAt?: Date | null } }
        ).props.qrTokenSetAt = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

        const neverRes = await repository.findAllForCrachas(tenantId, {
          rotationStatus: 'never',
          page: 1,
          pageSize: 50,
        });
        expect(neverRes.total).toBe(1);
        expect(neverRes.items[0].id).toBe(a.id.toString());

        const recentRes = await repository.findAllForCrachas(tenantId, {
          rotationStatus: 'recent',
          page: 1,
          pageSize: 50,
        });
        expect(recentRes.total).toBe(1);
        expect(recentRes.items[0].id).toBe(b.id.toString());

        const activeRes = await repository.findAllForCrachas(tenantId, {
          rotationStatus: 'active',
          page: 1,
          pageSize: 50,
        });
        // active = ever rotated → b + c
        expect(activeRes.total).toBe(2);
        expect(activeRes.items.map((i) => i.id).sort()).toEqual(
          [b.id.toString(), c.id.toString()].sort(),
        );
      });

      it('applies case-insensitive search against fullName OR registration', async () => {
        await seed({
          fullName: 'Ana Costa',
          registrationNumber: 'EMP-AAAA',
        });
        await seed({
          fullName: 'Bruno Lima',
          registrationNumber: 'EMP-BBBB',
        });

        const byName = await repository.findAllForCrachas(tenantId, {
          search: 'ANA',
          page: 1,
          pageSize: 50,
        });
        expect(byName.total).toBe(1);
        expect(byName.items[0].fullName).toBe('Ana Costa');

        const byReg = await repository.findAllForCrachas(tenantId, {
          search: 'emp-bbbb',
          page: 1,
          pageSize: 50,
        });
        expect(byReg.total).toBe(1);
        expect(byReg.items[0].fullName).toBe('Bruno Lima');
      });

      it('respects page + pageSize and returns total across pages', async () => {
        for (let i = 0; i < 55; i++) {
          await seed({
            cpfValue: generateValidCpfForSpec(i),
            fullName: `Emp ${String(i).padStart(2, '0')}`,
            registrationNumber: `EMP-${String(i).padStart(3, '0')}`,
          });
        }

        const page1 = await repository.findAllForCrachas(tenantId, {
          page: 1,
          pageSize: 50,
        });
        expect(page1.total).toBe(55);
        expect(page1.items).toHaveLength(50);

        const page2 = await repository.findAllForCrachas(tenantId, {
          page: 2,
          pageSize: 50,
        });
        expect(page2.total).toBe(55);
        expect(page2.items).toHaveLength(5);
      });

      it('hydrates departmentName from the in-memory lookup map', async () => {
        const dept = new UniqueEntityID();
        repository.departmentNamesById.set(dept.toString(), 'Financeiro');
        const a = await seed({
          fullName: 'Ana Costa',
          departmentId: dept,
        });

        const res = await repository.findAllForCrachas(tenantId, {
          page: 1,
          pageSize: 50,
        });
        expect(res.items[0].id).toBe(a.id.toString());
        expect(res.items[0].departmentName).toBe('Financeiro');
      });
    });

    // ──────────────────────────────────────────────────────────────────────
    // Phase 5 — PIN fallback (D-08, D-10, D-11)
    // ──────────────────────────────────────────────────────────────────────

    describe('updatePunchPin / updatePinLockState / clearPinLock', () => {
      it('updatePunchPin sets punchPinHash + punchPinSetAt inside the tenant', async () => {
        const emp = await seed();
        const setAt = new Date('2026-04-20T12:00:00Z');
        await repository.updatePunchPin(
          emp.id.toString(),
          tenantId,
          'bcrypt-hash-xxx',
          setAt,
        );

        expect(emp.punchPinHash).toBe('bcrypt-hash-xxx');
        expect(emp.punchPinSetAt?.getTime()).toBe(setAt.getTime());
      });

      it('updatePunchPin throws ResourceNotFoundError for cross-tenant ids', async () => {
        const emp = await seed({
          tenantId: otherTenantId,
        });
        await expect(
          repository.updatePunchPin(
            emp.id.toString(),
            tenantId,
            'hash',
            new Date(),
          ),
        ).rejects.toBeInstanceOf(ResourceNotFoundError);
      });

      it('updatePinLockState writes failedAttempts, lockedUntil and lastFailedAt atomically', async () => {
        const emp = await seed();
        const lockedUntil = new Date('2026-04-20T12:15:00Z');
        const lastFailedAt = new Date('2026-04-20T12:00:00Z');

        await repository.updatePinLockState(emp.id.toString(), tenantId, {
          failedAttempts: 3,
          lockedUntil: null,
          lastFailedAt,
        });

        expect(emp.punchPinFailedAttempts).toBe(3);
        expect(emp.punchPinLockedUntil).toBeNull();
        expect(emp.punchPinLastFailedAt?.getTime()).toBe(
          lastFailedAt.getTime(),
        );

        // Second call transitions to locked — lockedUntil becomes non-null.
        await repository.updatePinLockState(emp.id.toString(), tenantId, {
          failedAttempts: 0,
          lockedUntil,
          lastFailedAt,
        });

        expect(emp.punchPinFailedAttempts).toBe(0);
        expect(emp.punchPinLockedUntil?.getTime()).toBe(lockedUntil.getTime());
      });

      it('clearPinLock zeroes failedAttempts, lockedUntil and lastFailedAt', async () => {
        const emp = await seed();
        await repository.updatePinLockState(emp.id.toString(), tenantId, {
          failedAttempts: 4,
          lockedUntil: new Date('2026-04-20T12:15:00Z'),
          lastFailedAt: new Date('2026-04-20T12:00:00Z'),
        });

        await repository.clearPinLock(emp.id.toString(), tenantId);

        expect(emp.punchPinFailedAttempts).toBe(0);
        expect(emp.punchPinLockedUntil).toBeNull();
        expect(emp.punchPinLastFailedAt).toBeNull();
      });

      it('clearPinLock is idempotent on a never-locked employee', async () => {
        const emp = await seed();
        // No lock state exists. This must not throw.
        await repository.clearPinLock(emp.id.toString(), tenantId);
        expect(emp.punchPinFailedAttempts).toBe(0);
        expect(emp.punchPinLockedUntil).toBeNull();
      });

      it('updatePinLockState silently no-ops for cross-tenant ids (isolation)', async () => {
        const emp = await seed({
          tenantId: otherTenantId,
        });
        // Calling with `tenantId` (not otherTenantId) must not mutate the row.
        await repository.updatePinLockState(emp.id.toString(), tenantId, {
          failedAttempts: 99,
          lockedUntil: new Date(),
          lastFailedAt: new Date(),
        });
        expect(emp.punchPinFailedAttempts).toBe(0);
        expect(emp.punchPinLockedUntil).toBeNull();
      });
    });
  });
});

/**
 * Deterministic CPF generator for the specs above. Uses `Math.random` with
 * the `seed` only as an index bump to avoid duplicate CPFs across tests —
 * the actual check-digit computation follows the same algorithm as
 * `create-employee.e2e.ts#generateValidCPF`.
 */
function generateValidCpfForSpec(seed: number): string {
  const n1 = Math.floor(Math.random() * 10);
  const n2 = Math.floor(Math.random() * 10);
  const n3 = Math.floor(Math.random() * 10);
  const n4 = Math.floor(Math.random() * 10);
  const n5 = Math.floor(Math.random() * 10);
  const n6 = Math.floor(Math.random() * 10);
  const n7 = Math.floor(Math.random() * 10);
  const n8 = Math.floor(Math.random() * 10);
  const n9 = (Math.floor(Math.random() * 10) + seed) % 10;

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
