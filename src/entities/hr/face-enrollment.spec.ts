/**
 * Phase 5 / Plan 05-03 / Task 1 — FaceEnrollment entity spec.
 *
 * The domain entity carries CIPHERTEXT (not plaintext). The mapper keeps
 * encrypted bytes on the round-trip and decryption happens only at the
 * downstream FaceMatchValidator (Plan 05-07). This spec validates:
 *   - static create() populates id/createdAt/consentAuditLogId defaults
 *   - getters expose every domain field
 *   - softDelete() sets deletedAt
 */

import { describe, expect, it } from 'vitest';

import { UniqueEntityID } from '../domain/unique-entity-id';
import { FaceEnrollment } from './face-enrollment';

function baseProps(
  overrides: Partial<Parameters<typeof FaceEnrollment.create>[0]> = {},
) {
  return {
    tenantId: new UniqueEntityID('00000000-0000-0000-0000-000000000001'),
    employeeId: new UniqueEntityID('00000000-0000-0000-0000-000000000002'),
    embedding: Buffer.from('CIPHERTEXT-BYTES'),
    iv: Buffer.from('123456789012'),
    authTag: Buffer.from('AUTHTAG1234567AB'),
    photoCount: 1,
    capturedAt: new Date('2026-04-19T12:00:00.000Z'),
    capturedByUserId: new UniqueEntityID(
      '00000000-0000-0000-0000-000000000003',
    ),
    ...overrides,
  };
}

describe('FaceEnrollment Entity', () => {
  it('create() generates a new UniqueEntityID when none is provided', () => {
    const e = FaceEnrollment.create(baseProps());
    expect(e.id).toBeDefined();
    expect(e.id.toString()).toHaveLength(36); // uuid v4
  });

  it('create() assigns createdAt = now() when absent', () => {
    const before = Date.now();
    const e = FaceEnrollment.create(baseProps());
    const after = Date.now();
    expect(e.createdAt).toBeInstanceOf(Date);
    expect(e.createdAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(e.createdAt.getTime()).toBeLessThanOrEqual(after);
  });

  it('create() defaults consentAuditLogId to null when absent', () => {
    const e = FaceEnrollment.create(baseProps());
    expect(e.consentAuditLogId).toBeNull();
  });

  it('create() honors an explicit consentAuditLogId', () => {
    const e = FaceEnrollment.create(
      baseProps({ consentAuditLogId: 'audit-row-123' }),
    );
    expect(e.consentAuditLogId).toBe('audit-row-123');
  });

  it('softDelete() sets deletedAt to a Date', () => {
    const e = FaceEnrollment.create(baseProps());
    expect(e.deletedAt).toBeUndefined();
    e.softDelete();
    expect(e.deletedAt).toBeInstanceOf(Date);
  });

  it('exposes every required getter', () => {
    const capturedAt = new Date('2026-04-19T10:00:00.000Z');
    const props = baseProps({ photoCount: 3, capturedAt });
    const e = FaceEnrollment.create(props);

    expect(e.tenantId.toString()).toBe(props.tenantId.toString());
    expect(e.employeeId.toString()).toBe(props.employeeId.toString());
    expect(e.embedding).toEqual(props.embedding);
    expect(e.iv).toEqual(props.iv);
    expect(e.authTag).toEqual(props.authTag);
    expect(e.photoCount).toBe(3);
    expect(e.capturedAt).toBe(capturedAt);
    expect(e.capturedByUserId.toString()).toBe(
      props.capturedByUserId.toString(),
    );
    expect(e.consentAuditLogId).toBeNull();
    expect(e.deletedAt).toBeUndefined();
  });

  it('create() preserves an explicit id when supplied via second arg', () => {
    const id = new UniqueEntityID('00000000-0000-0000-0000-000000000aaa');
    const e = FaceEnrollment.create(baseProps(), id);
    expect(e.id.toString()).toBe('00000000-0000-0000-0000-000000000aaa');
  });
});
