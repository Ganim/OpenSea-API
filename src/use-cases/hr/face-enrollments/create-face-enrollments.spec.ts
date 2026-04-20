/**
 * Phase 5 / Plan 05-03 / Task 2 — CreateFaceEnrollmentsUseCase spec.
 *
 * Covers D-05 (3-5 fotos, replace policy), D-07 (consent hash required),
 * and T-FACE-02/03 (every row has a distinct IV; DTO never leaks ciphertext).
 */

import { randomBytes } from 'node:crypto';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryFaceEnrollmentsRepository } from '@/repositories/hr/in-memory/in-memory-face-enrollments-repository';
import { makeEmployee } from '@/utils/tests/factories/hr/make-employee';

import { CreateFaceEnrollmentsUseCase } from './create-face-enrollments';

const TENANT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const CAPTURED_BY = '33333333-3333-3333-3333-333333333333';
const VALID_HASH = 'a'.repeat(64);

function makeEmbedding(): number[] {
  const arr: number[] = [];
  for (let i = 0; i < 128; i++) arr.push(Math.random() * 2 - 1);
  return arr;
}

describe('CreateFaceEnrollmentsUseCase', () => {
  let useCase: CreateFaceEnrollmentsUseCase;
  let faceRepo: InMemoryFaceEnrollmentsRepository;
  let employeesRepo: InMemoryEmployeesRepository;
  let employeeId: string;

  beforeAll(() => {
    process.env.FACE_ENROLLMENT_ENCRYPTION_KEY =
      randomBytes(32).toString('base64');
  });

  beforeEach(async () => {
    faceRepo = new InMemoryFaceEnrollmentsRepository();
    employeesRepo = new InMemoryEmployeesRepository();
    useCase = new CreateFaceEnrollmentsUseCase(faceRepo, employeesRepo);

    const employee = makeEmployee({
      tenantId: new UniqueEntityID(TENANT_ID),
    });
    employeesRepo['items'] = [employee];
    employeeId = employee.id.toString();
  });

  it('rejects fewer than 3 embeddings with BadRequestError', async () => {
    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        employeeId,
        embeddings: [makeEmbedding(), makeEmbedding()],
        consentTextHash: VALID_HASH,
        capturedByUserId: CAPTURED_BY,
        consentAuditLogId: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects more than 5 embeddings with BadRequestError', async () => {
    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        employeeId,
        embeddings: [
          makeEmbedding(),
          makeEmbedding(),
          makeEmbedding(),
          makeEmbedding(),
          makeEmbedding(),
          makeEmbedding(),
        ],
        consentTextHash: VALID_HASH,
        capturedByUserId: CAPTURED_BY,
        consentAuditLogId: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects embeddings with wrong dimensionality (!== 128)', async () => {
    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        employeeId,
        embeddings: [makeEmbedding(), makeEmbedding(), [0.1, 0.2]],
        consentTextHash: VALID_HASH,
        capturedByUserId: CAPTURED_BY,
        consentAuditLogId: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects missing or empty consentTextHash', async () => {
    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        employeeId,
        embeddings: [makeEmbedding(), makeEmbedding(), makeEmbedding()],
        consentTextHash: '',
        capturedByUserId: CAPTURED_BY,
        consentAuditLogId: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects unknown employee with ResourceNotFoundError', async () => {
    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        employeeId: '00000000-0000-0000-0000-000000000999',
        embeddings: [makeEmbedding(), makeEmbedding(), makeEmbedding()],
        consentTextHash: VALID_HASH,
        capturedByUserId: CAPTURED_BY,
        consentAuditLogId: null,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('persists N enrollments on success', async () => {
    const result = await useCase.execute({
      tenantId: TENANT_ID,
      employeeId,
      embeddings: [makeEmbedding(), makeEmbedding(), makeEmbedding()],
      consentTextHash: VALID_HASH,
      capturedByUserId: CAPTURED_BY,
      consentAuditLogId: 'audit-log-123',
    });

    expect(result.enrollments).toHaveLength(3);
    expect(faceRepo.items).toHaveLength(3);
  });

  it('generates a distinct IV for each enrollment (no IV reuse)', async () => {
    await useCase.execute({
      tenantId: TENANT_ID,
      employeeId,
      embeddings: [
        makeEmbedding(),
        makeEmbedding(),
        makeEmbedding(),
        makeEmbedding(),
      ],
      consentTextHash: VALID_HASH,
      capturedByUserId: CAPTURED_BY,
      consentAuditLogId: null,
    });

    const ivs = faceRepo.items.map((e) => e.iv.toString('hex'));
    const unique = new Set(ivs);
    expect(unique.size).toBe(ivs.length);
  });

  it('response DTOs omit embedding/iv/authTag', async () => {
    const result = await useCase.execute({
      tenantId: TENANT_ID,
      employeeId,
      embeddings: [makeEmbedding(), makeEmbedding(), makeEmbedding()],
      consentTextHash: VALID_HASH,
      capturedByUserId: CAPTURED_BY,
      consentAuditLogId: null,
    });

    const serialized = JSON.stringify(result.enrollments);
    expect(serialized).not.toContain('embedding');
    expect(serialized).not.toContain('iv');
    expect(serialized).not.toContain('authTag');
    expect(serialized).not.toContain('ciphertext');
  });

  it('photoCount in response matches 1..N of the input array', async () => {
    const result = await useCase.execute({
      tenantId: TENANT_ID,
      employeeId,
      embeddings: [makeEmbedding(), makeEmbedding(), makeEmbedding()],
      consentTextHash: VALID_HASH,
      capturedByUserId: CAPTURED_BY,
      consentAuditLogId: null,
    });

    expect(result.enrollments.map((e) => e.photoCount)).toEqual([1, 2, 3]);
  });

  it('replace policy: soft-deletes existing enrollments before inserting new batch (D-05)', async () => {
    // First batch of 4
    await useCase.execute({
      tenantId: TENANT_ID,
      employeeId,
      embeddings: [
        makeEmbedding(),
        makeEmbedding(),
        makeEmbedding(),
        makeEmbedding(),
      ],
      consentTextHash: VALID_HASH,
      capturedByUserId: CAPTURED_BY,
      consentAuditLogId: null,
    });

    // Replace with a batch of 3
    const result = await useCase.execute({
      tenantId: TENANT_ID,
      employeeId,
      embeddings: [makeEmbedding(), makeEmbedding(), makeEmbedding()],
      consentTextHash: VALID_HASH,
      capturedByUserId: CAPTURED_BY,
      consentAuditLogId: null,
    });

    expect(result.replacedCount).toBe(4);
    // 4 original (soft-deleted) + 3 new = 7 total rows in the in-memory store
    expect(faceRepo.items).toHaveLength(7);
    // Only 3 remain active (the new batch)
    const active = await faceRepo.findByEmployeeId(employeeId, TENANT_ID);
    expect(active).toHaveLength(3);
  });

  it('persists ciphertext (not plaintext) — embedding buffer differs from any float round-trip', async () => {
    const embedding = makeEmbedding();
    await useCase.execute({
      tenantId: TENANT_ID,
      employeeId,
      embeddings: [embedding, makeEmbedding(), makeEmbedding()],
      consentTextHash: VALID_HASH,
      capturedByUserId: CAPTURED_BY,
      consentAuditLogId: null,
    });

    const stored = faceRepo.items[0];
    // Expected plaintext length = 128 floats × 4 bytes = 512 bytes
    // GCM ciphertext is same size as plaintext; what we check here is that
    // the bytes are NOT the raw float32 buffer (tamper-detection evidence
    // that encryption was applied).
    const rawPlaintext = Buffer.from(new Float32Array(embedding).buffer);
    expect(stored.embedding.equals(rawPlaintext)).toBe(false);
    expect(stored.embedding).toHaveLength(512);
  });
});
