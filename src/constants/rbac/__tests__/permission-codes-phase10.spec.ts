/**
 * Sentinel tests — Phase 10 / Plan 10-01 RBAC (hr.bio.*)
 *
 * Validates:
 * 1. PUNCH_BIO codes are defined and follow 3-level format (ADR-023)
 * 2. Audit messages for Phase 10 events have correct action+entity
 * 3. hr.bio.* codes are NOT in DEFAULT_USER_PERMISSIONS (regression guard — D-J1)
 */

import { describe, expect, it } from 'vitest';

import { DEFAULT_USER_PERMISSIONS, PermissionCodes } from '../permission-codes';
import { HR_AUDIT_MESSAGES } from '../../audit-messages/hr.messages';
import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';

describe('PermissionCodes.HR.PUNCH_BIO — Phase 10 (3-level ADR-023)', () => {
  it('ACCESS code has correct 3-level format', () => {
    expect(PermissionCodes.HR.PUNCH_BIO.ACCESS).toBe('hr.bio.access');
  });

  it('ENROLL code has correct 3-level format', () => {
    expect(PermissionCodes.HR.PUNCH_BIO.ENROLL).toBe('hr.bio.enroll');
  });

  it('ADMIN code has correct 3-level format', () => {
    expect(PermissionCodes.HR.PUNCH_BIO.ADMIN).toBe('hr.bio.admin');
  });

  it('all 3 codes are strings (not undefined)', () => {
    expect(typeof PermissionCodes.HR.PUNCH_BIO.ACCESS).toBe('string');
    expect(typeof PermissionCodes.HR.PUNCH_BIO.ENROLL).toBe('string');
    expect(typeof PermissionCodes.HR.PUNCH_BIO.ADMIN).toBe('string');
  });
});

describe('HR_AUDIT_MESSAGES — Phase 10 bio agent entries', () => {
  it('PUNCH_BIO_ENROLLED has correct action (BIO_ENROLLED)', () => {
    expect(HR_AUDIT_MESSAGES.PUNCH_BIO_ENROLLED.action).toBe(
      AuditAction.BIO_ENROLLED,
    );
  });

  it('PUNCH_BIO_ENROLLED has correct entity (PUNCH_BIO_AGENT)', () => {
    expect(HR_AUDIT_MESSAGES.PUNCH_BIO_ENROLLED.entity).toBe(
      AuditEntity.PUNCH_BIO_AGENT,
    );
  });

  it('PUNCH_BIO_ENROLLED description contains required placeholders', () => {
    const desc = HR_AUDIT_MESSAGES.PUNCH_BIO_ENROLLED.description;
    expect(desc).toContain('{{adminUserName}}');
    expect(desc).toContain('{{employeeName}}');
    expect(desc).toContain('{{deviceLabel}}');
  });

  it('PUNCH_BIO_AGENT_PAIRED has correct action (AGENT_PAIRED)', () => {
    expect(HR_AUDIT_MESSAGES.PUNCH_BIO_AGENT_PAIRED.action).toBe(
      AuditAction.AGENT_PAIRED,
    );
  });

  it('PUNCH_BIO_AGENT_REVOKED has correct action (AGENT_REVOKED)', () => {
    expect(HR_AUDIT_MESSAGES.PUNCH_BIO_AGENT_REVOKED.action).toBe(
      AuditAction.AGENT_REVOKED,
    );
  });

  it('PUNCH_BIO_MATCH has correct action (BIO_MATCH)', () => {
    expect(HR_AUDIT_MESSAGES.PUNCH_BIO_MATCH.action).toBe(
      AuditAction.BIO_MATCH,
    );
  });

  it('audit message descriptions do NOT contain CPF or email (T-10-01-04 LGPD)', () => {
    const bioMessages = [
      HR_AUDIT_MESSAGES.PUNCH_BIO_AGENT_PAIRED,
      HR_AUDIT_MESSAGES.PUNCH_BIO_ENROLLED,
      HR_AUDIT_MESSAGES.PUNCH_BIO_MATCH,
      HR_AUDIT_MESSAGES.PUNCH_BIO_AGENT_REVOKED,
    ];
    bioMessages.forEach((msg) => {
      expect(msg.description).not.toMatch(/cpf|email/i);
    });
  });
});

describe('DEFAULT_USER_PERMISSIONS — hr.bio.* admin-only gate (regression guard)', () => {
  it('hr.bio.access is NOT in DEFAULT_USER_PERMISSIONS (admin/RH only — D-J1)', () => {
    expect(DEFAULT_USER_PERMISSIONS).not.toContain('hr.bio.access');
  });

  it('hr.bio.enroll is NOT in DEFAULT_USER_PERMISSIONS (admin/RH only — D-J1)', () => {
    expect(DEFAULT_USER_PERMISSIONS).not.toContain('hr.bio.enroll');
  });

  it('hr.bio.admin is NOT in DEFAULT_USER_PERMISSIONS (admin/RH only — D-J1)', () => {
    expect(DEFAULT_USER_PERMISSIONS).not.toContain('hr.bio.admin');
  });
});
