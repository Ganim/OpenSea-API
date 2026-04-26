/**
 * Sentinel tests — Phase 10 / Plan 10-01 (Pitfall 8 Layer 1: TS identity)
 *
 * Validates that the TypeScript enum values for the Phase 10 biometric
 * punch-agent additions are defined and have the correct string values.
 * These tests catch the "TS enum value is undefined at runtime" failure
 * mode (Pitfall 8 Phase 06-02 D-203 lesson).
 *
 * Layer 2 (DB write sentinel) is in audit-enum-db-write.spec.ts — that test
 * actually writes to Postgres to confirm pg_enum alignment.
 */

import { describe, expect, it } from 'vitest';

import { AuditAction } from '../audit-action.enum';
import { AuditEntity } from '../audit-entity.enum';

describe('AuditAction — Phase 10 enum values (TS identity sentinel)', () => {
  it('AuditAction.AGENT_PAIRED is defined and has correct value', () => {
    expect(AuditAction.AGENT_PAIRED).toBe('AGENT_PAIRED');
  });

  it('AuditAction.BIO_ENROLLED is defined and has correct value', () => {
    expect(AuditAction.BIO_ENROLLED).toBe('BIO_ENROLLED');
  });

  it('AuditAction.BIO_MATCH is defined and has correct value', () => {
    expect(AuditAction.BIO_MATCH).toBe('BIO_MATCH');
  });

  it('AuditAction.AGENT_REVOKED is defined and has correct value', () => {
    expect(AuditAction.AGENT_REVOKED).toBe('AGENT_REVOKED');
  });

  it('Phase 10 values are not undefined (guards against missing enum entries)', () => {
    const phase10Actions = [
      AuditAction.AGENT_PAIRED,
      AuditAction.BIO_ENROLLED,
      AuditAction.BIO_MATCH,
      AuditAction.AGENT_REVOKED,
    ];
    phase10Actions.forEach((v) => expect(v).toBeDefined());
  });
});

describe('AuditEntity — Phase 10 enum values (TS identity sentinel)', () => {
  it('AuditEntity.PUNCH_BIO_AGENT is defined and has correct value', () => {
    expect(AuditEntity.PUNCH_BIO_AGENT).toBe('PUNCH_BIO_AGENT');
  });
});
