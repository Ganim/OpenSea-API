import { beforeAll, describe, expect, it, vi } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FaceEnrollment } from '@/entities/hr/face-enrollment';
import { PunchConfiguration } from '@/entities/hr/punch-configuration';
import { encryptEmbedding } from '@/lib/face-encryption';
import { InMemoryFaceEnrollmentsRepository } from '@/repositories/hr/in-memory/in-memory-face-enrollments-repository';
import { InMemoryPunchConfigRepository } from '@/repositories/hr/in-memory/in-memory-punch-config-repository';

import { createValidationContext } from '../__fixtures__/create-validation-context';
import { euclideanDistance, FaceMatchValidator } from './face-match.validator';

/**
 * Spec for FaceMatchValidator (Plan 05-07 / D-03). Covers the 8 scenarios
 * enumerated in the plan `<behavior>` block:
 *   1. embedding absent → ACCEPT short-circuit (JWT/dev path)
 *   2. embedding present + no enrollments → FaceEnrollmentRequiredError
 *   3. 3 enrollments, min distance under threshold → ACCEPT
 *   4. 3 enrollments, min distance over threshold → APPROVAL_REQUIRED with
 *      reason FACE_MATCH_LOW and full details payload
 *   5. tenant-configured threshold overrides the default
 *   6. punchConfig absent → defaults to 0.55
 *   7. NEVER returns REJECT (D-03 contract)
 *   8. decryptEmbedding is called exactly enrollmentCount times (decrypt
 *      happens inside the validator, not upstream)
 */
describe('FaceMatchValidator', () => {
  const TENANT_ID = 'tenant-1';
  const EMPLOYEE_ID = 'emp-1';

  beforeAll(() => {
    // The helper reads the env var lazily on first call; set it once for
    // the whole suite so `encryptEmbedding` / `decryptEmbedding` work.
    if (!process.env.FACE_ENROLLMENT_ENCRYPTION_KEY) {
      process.env.FACE_ENROLLMENT_ENCRYPTION_KEY = Buffer.from(
        '0123456789abcdef0123456789abcdef',
      ).toString('base64');
    }
  });

  /**
   * Produces a 128-d Float32Array where position `mark` is `value` and every
   * other position is 0. Euclidean distance between two such vectors is
   * deterministic: `sqrt((v1-v2)^2)` when they share `mark`, or
   * `sqrt(v1^2 + v2^2)` when different marks.
   */
  function makeEmbedding(mark: number, value: number): Float32Array {
    const arr = new Float32Array(128);
    arr[mark] = value;
    return arr;
  }

  function enrollFromVector(
    vector: Float32Array,
    { photoCount }: { photoCount: number },
  ): FaceEnrollment {
    const enc = encryptEmbedding(vector);
    return FaceEnrollment.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      embedding: enc.ciphertext,
      iv: enc.iv,
      authTag: enc.authTag,
      photoCount,
      capturedAt: new Date(),
      capturedByUserId: new UniqueEntityID('admin-1'),
      consentAuditLogId: null,
    });
  }

  function seedConfig(
    configRepo: InMemoryPunchConfigRepository,
    { faceMatchThreshold }: { faceMatchThreshold: number },
  ) {
    const existing = PunchConfiguration.create({
      tenantId: TENANT_ID,
      selfieRequired: true,
      gpsRequired: false,
      geofenceEnabled: false,
      qrCodeEnabled: true,
      directLoginEnabled: true,
      kioskModeEnabled: true,
      pwaEnabled: true,
      offlineAllowed: false,
      maxOfflineHours: 0,
      toleranceMinutes: 10,
      autoClockOutHours: null,
      pdfReceiptEnabled: true,
      defaultRadiusMeters: 100,
      faceMatchThreshold,
    });
    configRepo.items.push(existing);
  }

  it('ACCEPTs (short-circuit) when ctx.faceEmbedding is undefined — JWT/dev path', async () => {
    const enrollRepo = new InMemoryFaceEnrollmentsRepository();
    const configRepo = new InMemoryPunchConfigRepository();
    const validator = new FaceMatchValidator(enrollRepo, configRepo);

    const decision = await validator.validate(
      createValidationContext({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        faceEmbedding: undefined,
      }),
    );

    expect(decision).toEqual({ outcome: 'ACCEPT' });
  });

  it('throws FaceEnrollmentRequiredError when faceEmbedding present but employee has NO enrollments', async () => {
    const enrollRepo = new InMemoryFaceEnrollmentsRepository();
    const configRepo = new InMemoryPunchConfigRepository();
    const validator = new FaceMatchValidator(enrollRepo, configRepo);

    await expect(
      validator.validate(
        createValidationContext({
          tenantId: TENANT_ID,
          employeeId: EMPLOYEE_ID,
          faceEmbedding: Array.from(makeEmbedding(0, 0.1)),
        }),
      ),
    ).rejects.toMatchObject({ name: 'FaceEnrollmentRequiredError' });
  });

  it('ACCEPTs when min-distance across 3 enrollments falls below the threshold', async () => {
    const enrollRepo = new InMemoryFaceEnrollmentsRepository();
    const configRepo = new InMemoryPunchConfigRepository();
    seedConfig(configRepo, { faceMatchThreshold: 0.55 });

    // 3 enrollments: far, closer, closest.
    await enrollRepo.createMany([
      enrollFromVector(makeEmbedding(0, 1.0), { photoCount: 1 }),
      enrollFromVector(makeEmbedding(0, 0.6), { photoCount: 2 }),
      enrollFromVector(makeEmbedding(0, 0.5), { photoCount: 3 }),
    ]);

    const validator = new FaceMatchValidator(enrollRepo, configRepo);

    // Selfie at 0.8 → distances 0.2, 0.2, 0.3 — min = 0.2 < 0.55 → ACCEPT.
    const decision = await validator.validate(
      createValidationContext({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        faceEmbedding: Array.from(makeEmbedding(0, 0.8)),
      }),
    );

    expect(decision).toEqual({ outcome: 'ACCEPT' });
  });

  it('APPROVAL_REQUIRED with FACE_MATCH_LOW when every enrollment distance exceeds the threshold', async () => {
    const enrollRepo = new InMemoryFaceEnrollmentsRepository();
    const configRepo = new InMemoryPunchConfigRepository();
    seedConfig(configRepo, { faceMatchThreshold: 0.55 });

    await enrollRepo.createMany([
      enrollFromVector(makeEmbedding(0, 1.0), { photoCount: 1 }),
      enrollFromVector(makeEmbedding(0, 1.1), { photoCount: 2 }),
      enrollFromVector(makeEmbedding(0, 1.2), { photoCount: 3 }),
    ]);

    const validator = new FaceMatchValidator(enrollRepo, configRepo);

    // Selfie at 0.0 → distances 1.0, 1.1, 1.2 — min = 1.0 > 0.55 → APPROVAL.
    const decision = await validator.validate(
      createValidationContext({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        faceEmbedding: Array.from(makeEmbedding(0, 0.0)),
      }),
    );

    expect(decision.outcome).toBe('APPROVAL_REQUIRED');
    if (decision.outcome === 'APPROVAL_REQUIRED') {
      expect(decision.approvalReason).toBe('FACE_MATCH_LOW');
      expect(decision.details).toMatchObject({
        threshold: 0.55,
        enrollmentCount: 3,
      });
      expect(typeof decision.details.distance).toBe('number');
      expect(decision.details.distance as number).toBeGreaterThanOrEqual(1.0);
      expect(decision.details.distance as number).toBeLessThanOrEqual(1.2);
    }
  });

  it('respects the tenant-configured faceMatchThreshold (stricter 0.30 → reject a borderline match)', async () => {
    const enrollRepo = new InMemoryFaceEnrollmentsRepository();
    const configRepo = new InMemoryPunchConfigRepository();
    seedConfig(configRepo, { faceMatchThreshold: 0.3 });

    await enrollRepo.createMany([
      enrollFromVector(makeEmbedding(0, 1.0), { photoCount: 1 }),
    ]);

    const validator = new FaceMatchValidator(enrollRepo, configRepo);

    // Selfie at 0.6 → distance 0.4 — above the 0.3 tenant threshold.
    const decision = await validator.validate(
      createValidationContext({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        faceEmbedding: Array.from(makeEmbedding(0, 0.6)),
      }),
    );

    expect(decision.outcome).toBe('APPROVAL_REQUIRED');
    if (decision.outcome === 'APPROVAL_REQUIRED') {
      expect(decision.details.threshold).toBe(0.3);
    }
  });

  it('falls back to the DEFAULT threshold of 0.55 when punchConfig is absent', async () => {
    const enrollRepo = new InMemoryFaceEnrollmentsRepository();
    const configRepo = new InMemoryPunchConfigRepository();
    // Intentionally no seedConfig — findByTenantId will return null.

    await enrollRepo.createMany([
      enrollFromVector(makeEmbedding(0, 1.0), { photoCount: 1 }),
    ]);

    const validator = new FaceMatchValidator(enrollRepo, configRepo);

    // Selfie at 0.2 → distance 0.8 — above 0.55 default → APPROVAL_REQUIRED
    // with threshold=0.55 in the details.
    const decision = await validator.validate(
      createValidationContext({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        faceEmbedding: Array.from(makeEmbedding(0, 0.2)),
      }),
    );

    expect(decision.outcome).toBe('APPROVAL_REQUIRED');
    if (decision.outcome === 'APPROVAL_REQUIRED') {
      expect(decision.details.threshold).toBe(0.55);
    }
  });

  it('NEVER returns REJECT under any embedding/threshold combination (D-03 contract)', async () => {
    const enrollRepo = new InMemoryFaceEnrollmentsRepository();
    const configRepo = new InMemoryPunchConfigRepository();
    seedConfig(configRepo, { faceMatchThreshold: 0.55 });

    await enrollRepo.createMany([
      enrollFromVector(makeEmbedding(0, 1.0), { photoCount: 1 }),
    ]);

    const validator = new FaceMatchValidator(enrollRepo, configRepo);

    // Farthest possible selfie; distance far exceeds threshold.
    const decision = await validator.validate(
      createValidationContext({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        faceEmbedding: Array.from(makeEmbedding(127, -10)),
      }),
    );

    expect(decision.outcome).not.toBe('REJECT');
  });

  it('calls decryptEmbedding exactly enrollments.length times (decrypt scoped to this validator)', async () => {
    const enrollRepo = new InMemoryFaceEnrollmentsRepository();
    const configRepo = new InMemoryPunchConfigRepository();
    seedConfig(configRepo, { faceMatchThreshold: 0.55 });

    // 4 enrollments → expect 4 calls to decryptEmbedding.
    await enrollRepo.createMany([
      enrollFromVector(makeEmbedding(0, 0.4), { photoCount: 1 }),
      enrollFromVector(makeEmbedding(0, 0.5), { photoCount: 2 }),
      enrollFromVector(makeEmbedding(0, 0.6), { photoCount: 3 }),
      enrollFromVector(makeEmbedding(0, 0.7), { photoCount: 4 }),
    ]);

    const faceEncryptionModule = await import('@/lib/face-encryption');
    const decryptSpy = vi.spyOn(faceEncryptionModule, 'decryptEmbedding');

    const validator = new FaceMatchValidator(enrollRepo, configRepo);
    await validator.validate(
      createValidationContext({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        faceEmbedding: Array.from(makeEmbedding(0, 0.55)),
      }),
    );

    expect(decryptSpy).toHaveBeenCalledTimes(4);
    decryptSpy.mockRestore();
  });
});

describe('euclideanDistance helper', () => {
  it('returns 0 for identical vectors', () => {
    const a = new Float32Array(128);
    const b = new Float32Array(128);
    expect(euclideanDistance(a, b)).toBe(0);
  });

  it('returns sqrt(sum((a-b)^2)) for component-wise deltas', () => {
    const a = new Float32Array(128);
    const b = new Float32Array(128);
    a[0] = 3;
    b[0] = 0;
    a[1] = 4;
    b[1] = 0;
    // 3-4-5 Pythagorean triple: sqrt(9 + 16) = 5.
    expect(euclideanDistance(a, b)).toBeCloseTo(5, 5);
  });

  it('accepts plain number[] inputs (serialized JSON from the HTTP layer)', () => {
    const a = Array.from(new Float32Array(128));
    const b = Array.from(new Float32Array(128));
    a[0] = 1;
    // No deltas elsewhere.
    expect(euclideanDistance(a, b)).toBe(1);
  });
});
