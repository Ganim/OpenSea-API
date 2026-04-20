/**
 * Phase 5 / Plan 05-03 / Task 2 — ListFaceEnrollmentsUseCase spec.
 *
 * Validates DTO shape (metadata only, no crypto material) and cross-tenant
 * isolation.
 */

import { randomBytes } from 'node:crypto';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FaceEnrollment } from '@/entities/hr/face-enrollment';
import { InMemoryFaceEnrollmentsRepository } from '@/repositories/hr/in-memory/in-memory-face-enrollments-repository';

import { ListFaceEnrollmentsUseCase } from './list-face-enrollments';

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const EMPLOYEE_ID = '11111111-1111-1111-1111-111111111111';

function makeRow(tenantId: string, photoCount: number): FaceEnrollment {
  return FaceEnrollment.create({
    tenantId: new UniqueEntityID(tenantId),
    employeeId: new UniqueEntityID(EMPLOYEE_ID),
    embedding: Buffer.from('ciphertext-xyz'),
    iv: Buffer.from('123456789012'),
    authTag: Buffer.from('AUTHTAG1234567AB'),
    photoCount,
    capturedAt: new Date(`2026-04-19T12:0${photoCount}:00.000Z`),
    capturedByUserId: new UniqueEntityID(),
  });
}

describe('ListFaceEnrollmentsUseCase', () => {
  let useCase: ListFaceEnrollmentsUseCase;
  let repo: InMemoryFaceEnrollmentsRepository;

  beforeAll(() => {
    process.env.FACE_ENROLLMENT_ENCRYPTION_KEY =
      randomBytes(32).toString('base64');
  });

  beforeEach(() => {
    repo = new InMemoryFaceEnrollmentsRepository();
    useCase = new ListFaceEnrollmentsUseCase(repo);
  });

  it('returns an empty list when the employee has no enrollments', async () => {
    const result = await useCase.execute({
      tenantId: TENANT_A,
      employeeId: EMPLOYEE_ID,
    });
    expect(result.count).toBe(0);
    expect(result.items).toEqual([]);
  });

  it('returns metadata-only DTOs (no ciphertext / iv / authTag)', async () => {
    await repo.createMany([
      makeRow(TENANT_A, 1),
      makeRow(TENANT_A, 2),
      makeRow(TENANT_A, 3),
    ]);
    const result = await useCase.execute({
      tenantId: TENANT_A,
      employeeId: EMPLOYEE_ID,
    });

    expect(result.count).toBe(3);
    expect(result.items).toHaveLength(3);

    const serialized = JSON.stringify(result.items);
    expect(serialized).not.toContain('embedding');
    expect(serialized).not.toContain('iv');
    expect(serialized).not.toContain('authTag');
    expect(serialized).not.toContain('ciphertext');

    for (const item of result.items) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('employeeId', EMPLOYEE_ID);
      expect(item).toHaveProperty('photoCount');
      expect(item).toHaveProperty('capturedAt');
      expect(item).toHaveProperty('capturedByUserId');
      expect(item).toHaveProperty('createdAt');
    }
  });

  it('respects cross-tenant isolation', async () => {
    await repo.createMany([
      makeRow(TENANT_A, 1),
      makeRow(TENANT_A, 2),
      makeRow(TENANT_B, 1),
    ]);

    const result = await useCase.execute({
      tenantId: TENANT_B,
      employeeId: EMPLOYEE_ID,
    });
    expect(result.count).toBe(1);
  });
});
