import { describe, expect, it } from 'vitest';

import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';

import { HR_AUDIT_MESSAGES } from './hr.messages';

/**
 * Spec narrowly scoped to Phase 5 (Plan 05-02) audit messages.
 *
 * Validates that every new HR audit-message key declared by Plan 05-02 is
 * (a) present, (b) routed to the correct AuditEntity / AuditAction /
 * AuditModule, and (c) carries a non-empty Portuguese description with the
 * expected placeholder tokens. Phase 4 messages (PUNCH_DEVICE_*,
 * PUNCH_APPROVAL_*, PUNCH_REGISTERED) are NOT re-asserted here — they are
 * load-bearing in production already and any regression would be caught at
 * the call sites.
 */
describe('HR_AUDIT_MESSAGES — Phase 5 (Plan 05-02) additions', () => {
  describe('PUNCH_QR_TOKEN_ROTATED', () => {
    const msg = HR_AUDIT_MESSAGES.PUNCH_QR_TOKEN_ROTATED;

    it('routes to AuditEntity.PUNCH_QR_TOKEN + AuditAction.UPDATE + AuditModule.HR', () => {
      expect(msg.entity).toBe(AuditEntity.PUNCH_QR_TOKEN);
      expect(msg.action).toBe(AuditAction.UPDATE);
      expect(msg.module).toBe(AuditModule.HR);
    });

    it('description has employeeName + userName placeholders', () => {
      expect(msg.description).toMatch(/{{userName}}/);
      expect(msg.description).toMatch(/{{employeeName}}/);
      expect(msg.description.length).toBeGreaterThan(0);
    });
  });

  describe('PUNCH_FACE_ENROLLMENT_CREATED', () => {
    const msg = HR_AUDIT_MESSAGES.PUNCH_FACE_ENROLLMENT_CREATED;

    it('routes to AuditEntity.FACE_ENROLLMENT + AuditAction.CREATE + AuditModule.HR', () => {
      expect(msg.entity).toBe(AuditEntity.FACE_ENROLLMENT);
      expect(msg.action).toBe(AuditAction.CREATE);
      expect(msg.module).toBe(AuditModule.HR);
    });

    it('description has photoCount placeholder for traceability', () => {
      expect(msg.description).toMatch(/{{userName}}/);
      expect(msg.description).toMatch(/{{employeeName}}/);
      expect(msg.description).toMatch(/{{photoCount}}/);
    });
  });

  describe('PUNCH_FACE_ENROLLMENT_REMOVED', () => {
    const msg = HR_AUDIT_MESSAGES.PUNCH_FACE_ENROLLMENT_REMOVED;

    it('routes to AuditEntity.FACE_ENROLLMENT + AuditAction.DELETE', () => {
      expect(msg.entity).toBe(AuditEntity.FACE_ENROLLMENT);
      expect(msg.action).toBe(AuditAction.DELETE);
      expect(msg.module).toBe(AuditModule.HR);
    });

    it('description references userName + employeeName', () => {
      expect(msg.description).toMatch(/{{userName}}/);
      expect(msg.description).toMatch(/{{employeeName}}/);
    });
  });

  describe('PUNCH_FACE_ENROLLMENT_CONSENT_GIVEN (LGPD — D-07)', () => {
    const msg = HR_AUDIT_MESSAGES.PUNCH_FACE_ENROLLMENT_CONSENT_GIVEN;

    it('routes to AuditEntity.FACE_ENROLLMENT + AuditAction.CREATE', () => {
      expect(msg.entity).toBe(AuditEntity.FACE_ENROLLMENT);
      expect(msg.action).toBe(AuditAction.CREATE);
      expect(msg.module).toBe(AuditModule.HR);
    });

    it('description carries consentTextHash placeholder for forensic verification', () => {
      expect(msg.description).toMatch(/{{userName}}/);
      expect(msg.description).toMatch(/{{employeeName}}/);
      expect(msg.description).toMatch(/{{consentTextHash}}/);
      expect(msg.description.toLowerCase()).toContain('lgpd');
    });
  });

  describe('PUNCH_PIN_SET', () => {
    const msg = HR_AUDIT_MESSAGES.PUNCH_PIN_SET;

    it('routes to AuditEntity.PUNCH_PIN + AuditAction.UPDATE', () => {
      expect(msg.entity).toBe(AuditEntity.PUNCH_PIN);
      expect(msg.action).toBe(AuditAction.UPDATE);
      expect(msg.module).toBe(AuditModule.HR);
    });

    it('description references userName + employeeName', () => {
      expect(msg.description).toMatch(/{{userName}}/);
      expect(msg.description).toMatch(/{{employeeName}}/);
    });
  });

  describe('PUNCH_PIN_LOCKED (auto, no userName per T-PIN-02)', () => {
    const msg = HR_AUDIT_MESSAGES.PUNCH_PIN_LOCKED;

    it('routes to AuditEntity.PUNCH_PIN + AuditAction.UPDATE', () => {
      expect(msg.entity).toBe(AuditEntity.PUNCH_PIN);
      expect(msg.action).toBe(AuditAction.UPDATE);
      expect(msg.module).toBe(AuditModule.HR);
    });

    it('description has employeeName + attempts placeholders', () => {
      expect(msg.description).toMatch(/{{employeeName}}/);
      expect(msg.description).toMatch(/{{attempts}}/);
    });

    it('description does NOT include the PIN value (T-PIN-02 mitigation)', () => {
      // sanity check — the placeholder name "pin" must not appear in any form
      expect(msg.description.toLowerCase()).not.toContain('{{pin}}');
    });
  });

  describe('PUNCH_PIN_UNLOCKED', () => {
    const msg = HR_AUDIT_MESSAGES.PUNCH_PIN_UNLOCKED;

    it('routes to AuditEntity.PUNCH_PIN + AuditAction.UPDATE', () => {
      expect(msg.entity).toBe(AuditEntity.PUNCH_PIN);
      expect(msg.action).toBe(AuditAction.UPDATE);
      expect(msg.module).toBe(AuditModule.HR);
    });

    it('description references userName + employeeName', () => {
      expect(msg.description).toMatch(/{{userName}}/);
      expect(msg.description).toMatch(/{{employeeName}}/);
    });
  });

  describe('contract: every Phase-5 message has a non-empty pt-BR description', () => {
    const phase5Keys = [
      'PUNCH_QR_TOKEN_ROTATED',
      'PUNCH_FACE_ENROLLMENT_CREATED',
      'PUNCH_FACE_ENROLLMENT_REMOVED',
      'PUNCH_FACE_ENROLLMENT_CONSENT_GIVEN',
      'PUNCH_PIN_SET',
      'PUNCH_PIN_LOCKED',
      'PUNCH_PIN_UNLOCKED',
    ] as const;

    it('exposes all 7 keys', () => {
      phase5Keys.forEach((key) => {
        expect(HR_AUDIT_MESSAGES).toHaveProperty(key);
      });
    });

    it('each description is a non-empty string and references AuditModule.HR', () => {
      phase5Keys.forEach((key) => {
        const m = HR_AUDIT_MESSAGES[key];
        expect(typeof m.description).toBe('string');
        expect(m.description.trim().length).toBeGreaterThan(0);
        expect(m.module).toBe(AuditModule.HR);
      });
    });
  });
});
