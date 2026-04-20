/**
 * Phase 5 / Plan 05-03 / Task 2 — RemoveFaceEnrollmentsUseCase spec.
 *
 * Validates admin-triggered soft-delete semantics: all rows for an employee
 * (scoped by tenant) are marked deleted; idempotent; cross-tenant isolation.
 */

import { randomBytes } from 'node:crypto';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FaceEnrollment } from '@/entities/hr/face-enrollment';
import { InMemoryFaceEnrollmentsRepository } from '@/repositories/hr/in-memory/in-memory-face-enrollments-repository';

import { RemoveFaceEnrollmentsUseCase } from './remove-face-enrollments';

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const EMPLOYEE_ID = '11111111-1111-1111-1111-111111111111';

function seed(tenantId: string, count: number): FaceEnrollment[] {
  const arr: FaceEnrollment[] = [];
  for (let i = 0; i < count; i++) {
    arr.push(
      FaceEnrollment.create({
        tenantId: new UniqueEntityID(tenantId),
        employeeId: new UniqueEntityID(EMPLOYEE_ID),
        embedding: Buffer.from('ciphertext'),
        iv: Buffer.from('123456789012'),
        authTag: Buffer.from('AUTHTAG1234567AB'),
        photoCount: i + 1,
        capturedAt: new Date(),
        capturedByUserId: new UniqueEntityID(),
      }),
    );
  }
  return arr;
}

describe('RemoveFaceEnrollmentsUseCase', () => {
  let useCase: RemoveFaceEnrollmentsUseCase;
  let repo: InMemoryFaceEnrollmentsRepository;

  beforeAll(() => {
    process.env.FACE_ENROLLMENT_ENCRYPTION_KEY =
      randomBytes(32).toString('base64');
  });

  beforeEach(() => {
    repo = new InMemoryFaceEnrollmentsRepository();
    useCase = new RemoveFaceEnrollmentsUseCase(repo);
  });

  it('soft-deletes every enrollment for the employee (tenant-scoped)', async () => {
    await repo.createMany(seed(TENANT_A, 4));
    const result = await useCase.execute({
      tenantId: TENANT_A,
      employeeId: EMPLOYEE_ID,
    });

    expect(result.removedCount).toBe(4);
    const active = await repo.findByEmployeeId(EMPLOYEE_ID, TENANT_A);
    expect(active).toHaveLength(0);
  });

  it('is idempotent — second call returns 0', async () => {
    await repo.createMany(seed(TENANT_A, 3));
    await useCase.execute({ tenantId: TENANT_A, employeeId: EMPLOYEE_ID });
    const second = await useCase.execute({
      tenantId: TENANT_A,
      employeeId: EMPLOYEE_ID,
    });

    expect(second.removedCount).toBe(0);
  });

  it('respects cross-tenant isolation — does NOT soft-delete another tenant’s rows', async () => {
    const rowsA = seed(TENANT_A, 2);
    const rowsB = seed(TENANT_B, 3);
    await repo.createMany([...rowsA, ...rowsB]);

    const result = await useCase.execute({
      tenantId: TENANT_B,
      employeeId: EMPLOYEE_ID,
    });

    expect(result.removedCount).toBe(3);
    // Tenant A rows still active
    const stillActiveA = await repo.findByEmployeeId(EMPLOYEE_ID, TENANT_A);
    expect(stillActiveA).toHaveLength(2);
  });
});
