/**
 * Phase 5 / Plan 05-03 / Task 1 — InMemoryFaceEnrollmentsRepository spec.
 *
 * Validates cross-tenant isolation, soft-delete semantics, and count helpers
 * used by the CreateFaceEnrollmentsUseCase (replace policy) and the future
 * FaceMatchValidator (Plan 05-07).
 */

import { describe, expect, it } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FaceEnrollment } from '@/entities/hr/face-enrollment';

import { InMemoryFaceEnrollmentsRepository } from './in-memory-face-enrollments-repository';

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const EMPLOYEE_1 = '11111111-1111-1111-1111-111111111111';
const EMPLOYEE_2 = '22222222-2222-2222-2222-222222222222';

function makeEnrollment(
  overrides: {
    tenantId?: string;
    employeeId?: string;
    photoCount?: number;
  } = {},
): FaceEnrollment {
  return FaceEnrollment.create({
    tenantId: new UniqueEntityID(overrides.tenantId ?? TENANT_A),
    employeeId: new UniqueEntityID(overrides.employeeId ?? EMPLOYEE_1),
    embedding: Buffer.from('ciphertext'),
    iv: Buffer.from('123456789012'),
    authTag: Buffer.from('AUTHTAG1234567AB'),
    photoCount: overrides.photoCount ?? 1,
    capturedAt: new Date(),
    capturedByUserId: new UniqueEntityID(),
  });
}

describe('InMemoryFaceEnrollmentsRepository', () => {
  it('createMany() stores every enrollment', async () => {
    const repo = new InMemoryFaceEnrollmentsRepository();
    await repo.createMany([
      makeEnrollment({ photoCount: 1 }),
      makeEnrollment({ photoCount: 2 }),
      makeEnrollment({ photoCount: 3 }),
    ]);

    expect(repo.items).toHaveLength(3);
  });

  it('findByEmployeeId() returns only non-deleted enrollments for the given tenant + employee', async () => {
    const repo = new InMemoryFaceEnrollmentsRepository();
    const active = makeEnrollment({ photoCount: 1 });
    const deleted = makeEnrollment({ photoCount: 2 });
    deleted.softDelete();
    const otherEmployee = makeEnrollment({
      employeeId: EMPLOYEE_2,
      photoCount: 1,
    });
    const otherTenant = makeEnrollment({ tenantId: TENANT_B, photoCount: 1 });

    await repo.createMany([active, deleted, otherEmployee, otherTenant]);

    const result = await repo.findByEmployeeId(EMPLOYEE_1, TENANT_A);
    expect(result).toHaveLength(1);
    expect(result[0].id.toString()).toBe(active.id.toString());
  });

  it('findByEmployeeId() with cross-tenant employeeId returns []', async () => {
    const repo = new InMemoryFaceEnrollmentsRepository();
    await repo.createMany([
      makeEnrollment({ tenantId: TENANT_A, employeeId: EMPLOYEE_1 }),
    ]);

    const result = await repo.findByEmployeeId(EMPLOYEE_1, TENANT_B);
    expect(result).toEqual([]);
  });

  it('softDeleteAllByEmployee() marks all active rows as deleted and returns the count', async () => {
    const repo = new InMemoryFaceEnrollmentsRepository();
    await repo.createMany([
      makeEnrollment({ photoCount: 1 }),
      makeEnrollment({ photoCount: 2 }),
      makeEnrollment({ photoCount: 3 }),
    ]);

    const count = await repo.softDeleteAllByEmployee(EMPLOYEE_1, TENANT_A);
    expect(count).toBe(3);

    const active = await repo.findByEmployeeId(EMPLOYEE_1, TENANT_A);
    expect(active).toHaveLength(0);
    // Items remain in the array but all soft-deleted
    expect(repo.items.every((e) => e.deletedAt)).toBe(true);
  });

  it('softDeleteAllByEmployee() is idempotent (second call returns 0)', async () => {
    const repo = new InMemoryFaceEnrollmentsRepository();
    await repo.createMany([
      makeEnrollment(),
      makeEnrollment({ photoCount: 2 }),
    ]);

    await repo.softDeleteAllByEmployee(EMPLOYEE_1, TENANT_A);
    const second = await repo.softDeleteAllByEmployee(EMPLOYEE_1, TENANT_A);

    expect(second).toBe(0);
  });

  it('softDeleteAllByEmployee() respects tenant isolation', async () => {
    const repo = new InMemoryFaceEnrollmentsRepository();
    const atA = makeEnrollment({ tenantId: TENANT_A });
    const atB = makeEnrollment({ tenantId: TENANT_B });
    await repo.createMany([atA, atB]);

    const deleted = await repo.softDeleteAllByEmployee(EMPLOYEE_1, TENANT_B);
    expect(deleted).toBe(1);
    expect(atA.deletedAt).toBeUndefined();
    expect(atB.deletedAt).toBeInstanceOf(Date);
  });

  it('countByEmployeeId() returns the count of non-deleted enrollments', async () => {
    const repo = new InMemoryFaceEnrollmentsRepository();
    const kept = makeEnrollment({ photoCount: 1 });
    const deleted = makeEnrollment({ photoCount: 2 });
    deleted.softDelete();
    await repo.createMany([kept, deleted]);

    expect(await repo.countByEmployeeId(EMPLOYEE_1, TENANT_A)).toBe(1);
  });

  it('findById() respects tenantId isolation', async () => {
    const repo = new InMemoryFaceEnrollmentsRepository();
    const enrollment = makeEnrollment({ tenantId: TENANT_A });
    await repo.createMany([enrollment]);

    const same = await repo.findById(enrollment.id, TENANT_A);
    expect(same?.id.toString()).toBe(enrollment.id.toString());

    const cross = await repo.findById(enrollment.id, TENANT_B);
    expect(cross).toBeNull();
  });

  it('findById() returns null for soft-deleted enrollments', async () => {
    const repo = new InMemoryFaceEnrollmentsRepository();
    const enrollment = makeEnrollment();
    enrollment.softDelete();
    await repo.createMany([enrollment]);

    const result = await repo.findById(enrollment.id, TENANT_A);
    expect(result).toBeNull();
  });
});
