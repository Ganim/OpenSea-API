import { describe, expect, it } from 'vitest';

import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '../public/index.js';
import { punchManifest } from './punch.manifest';

describe('punchManifest', () => {
  describe('module metadata', () => {
    it('declares module "punch" with displayName Ponto', () => {
      expect(punchManifest.module).toBe('punch');
      expect(punchManifest.displayName).toBe('Ponto');
    });

    it('uses icon "Clock" and order 35 (between HR 30 and Finance 40)', () => {
      expect(punchManifest.icon).toBe('Clock');
      expect(punchManifest.order).toBe(35);
    });
  });

  describe('categories', () => {
    it('declares exactly 12 categories (3 phase-4 + 2 phase-5 + 3 phase-7 + 3 phase-9 + 1 phase-10)', () => {
      expect(punchManifest.categories).toHaveLength(12);
    });

    it('declares the expected category codes in order (phase 4 → 5 → 7 → 9 → 10)', () => {
      const codes = punchManifest.categories.map((c) => c.code);
      expect(codes).toEqual([
        'punch.registered',
        'punch.late',
        'punch.approval_requested',
        'punch.pin_locked',
        'punch.qr_rotation.completed',
        'punch.daily_digest',
        'punch.exception_approval_requested',
        'punch.export_ready',
        'punch.face_match_alert',
        'punch.missed_punch_manager',
        'punch.missed_punch_employee',
        'punch.agent_update_failed',
      ]);
    });

    it('punch.registered is INFORMATIONAL/NORMAL/[IN_APP,PUSH], digest-supported', () => {
      const category = punchManifest.categories.find(
        (c) => c.code === 'punch.registered',
      );
      expect(category).toBeDefined();
      expect(category!.defaultType).toBe(NotificationType.INFORMATIONAL);
      expect(category!.defaultPriority).toBe(NotificationPriority.NORMAL);
      expect(category!.defaultChannels).toEqual([
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
      ]);
      expect(category!.digestSupported).toBe(true);
    });

    it('punch.late is ACTIONABLE/HIGH/[IN_APP,EMAIL], digest-supported', () => {
      const category = punchManifest.categories.find(
        (c) => c.code === 'punch.late',
      );
      expect(category).toBeDefined();
      expect(category!.defaultType).toBe(NotificationType.ACTIONABLE);
      expect(category!.defaultPriority).toBe(NotificationPriority.HIGH);
      expect(category!.defaultChannels).toEqual([
        NotificationChannel.IN_APP,
        NotificationChannel.EMAIL,
      ]);
      expect(category!.digestSupported).toBe(true);
    });

    it('punch.approval_requested is APPROVAL/HIGH/[IN_APP,EMAIL], NOT digest-supported', () => {
      const category = punchManifest.categories.find(
        (c) => c.code === 'punch.approval_requested',
      );
      expect(category).toBeDefined();
      expect(category!.defaultType).toBe(NotificationType.APPROVAL);
      expect(category!.defaultPriority).toBe(NotificationPriority.HIGH);
      expect(category!.defaultChannels).toEqual([
        NotificationChannel.IN_APP,
        NotificationChannel.EMAIL,
      ]);
      expect(category!.digestSupported).toBe(false);
    });

    // ─── Phase 5 additions (Plan 05-02) ─────────────────────────────────────

    it('punch.pin_locked is ACTIONABLE/HIGH/[IN_APP,EMAIL], NOT digest-supported (D-11)', () => {
      const category = punchManifest.categories.find(
        (c) => c.code === 'punch.pin_locked',
      );
      expect(category).toBeDefined();
      expect(category!.defaultType).toBe(NotificationType.ACTIONABLE);
      expect(category!.defaultPriority).toBe(NotificationPriority.HIGH);
      expect(category!.defaultChannels).toContain(NotificationChannel.IN_APP);
      expect(category!.defaultChannels).toContain(NotificationChannel.EMAIL);
      expect(category!.digestSupported).toBe(false);
      // pt-BR copy
      expect(category!.name.length).toBeGreaterThan(0);
      expect(category!.description?.length ?? 0).toBeGreaterThan(0);
    });

    it('punch.qr_rotation.completed is INFORMATIONAL/NORMAL/[IN_APP], digest-supported (D-14)', () => {
      const category = punchManifest.categories.find(
        (c) => c.code === 'punch.qr_rotation.completed',
      );
      expect(category).toBeDefined();
      expect(category!.defaultType).toBe(NotificationType.INFORMATIONAL);
      expect(category!.defaultPriority).toBe(NotificationPriority.NORMAL);
      expect(category!.defaultChannels).toContain(NotificationChannel.IN_APP);
      expect(category!.digestSupported).toBe(true);
      // pt-BR copy
      expect(category!.name.length).toBeGreaterThan(0);
      expect(category!.description?.length ?? 0).toBeGreaterThan(0);
    });

    // ─── Phase 7 additions (Plan 07-01) ─────────────────────────────────────

    it('punch.daily_digest is INFORMATIONAL/NORMAL/[IN_APP,EMAIL], NOT digest-supported (D-14, é próprio digest)', () => {
      const category = punchManifest.categories.find(
        (c) => c.code === 'punch.daily_digest',
      );
      expect(category).toBeDefined();
      expect(category!.defaultType).toBe(NotificationType.INFORMATIONAL);
      expect(category!.defaultPriority).toBe(NotificationPriority.NORMAL);
      expect(category!.defaultChannels).toEqual([
        NotificationChannel.IN_APP,
        NotificationChannel.EMAIL,
      ]);
      expect(category!.digestSupported).toBe(false);
      // pt-BR copy
      expect(category!.name.length).toBeGreaterThan(0);
      expect(category!.description?.length ?? 0).toBeGreaterThan(0);
    });

    it('punch.exception_approval_requested is ACTIONABLE/HIGH/[IN_APP,PUSH,EMAIL], NOT digest-supported (D-15)', () => {
      const category = punchManifest.categories.find(
        (c) => c.code === 'punch.exception_approval_requested',
      );
      expect(category).toBeDefined();
      expect(category!.defaultType).toBe(NotificationType.ACTIONABLE);
      expect(category!.defaultPriority).toBe(NotificationPriority.HIGH);
      expect(category!.defaultChannels).toEqual([
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
        NotificationChannel.EMAIL,
      ]);
      expect(category!.digestSupported).toBe(false);
      // pt-BR copy
      expect(category!.name.length).toBeGreaterThan(0);
      expect(category!.description?.length ?? 0).toBeGreaterThan(0);
    });

    it('punch.export_ready is INFORMATIONAL/NORMAL/[IN_APP], NOT digest-supported (D-11 async export)', () => {
      const category = punchManifest.categories.find(
        (c) => c.code === 'punch.export_ready',
      );
      expect(category).toBeDefined();
      expect(category!.defaultType).toBe(NotificationType.INFORMATIONAL);
      expect(category!.defaultPriority).toBe(NotificationPriority.NORMAL);
      expect(category!.defaultChannels).toEqual([NotificationChannel.IN_APP]);
      expect(category!.digestSupported).toBe(false);
      // pt-BR copy
      expect(category!.name.length).toBeGreaterThan(0);
      expect(category!.description?.length ?? 0).toBeGreaterThan(0);
    });

    // ─── Phase 9 additions (Plan 09-01) ─────────────────────────────────────

    it('punch.face_match_alert is ACTIONABLE/HIGH/[IN_APP,PUSH], NOT digest-supported (D-11)', () => {
      const category = punchManifest.categories.find(
        (c) => c.code === 'punch.face_match_alert',
      );
      expect(category).toBeDefined();
      expect(category!.defaultType).toBe(NotificationType.ACTIONABLE);
      expect(category!.defaultPriority).toBe(NotificationPriority.HIGH);
      expect(category!.defaultChannels).toEqual([
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
      ]);
      expect(category!.digestSupported).toBe(false);
      expect(category!.name.length).toBeGreaterThan(0);
      expect(category!.description?.length ?? 0).toBeGreaterThan(0);
    });

    it('punch.missed_punch_manager is INFORMATIONAL/HIGH/[IN_APP,PUSH,EMAIL], NOT digest-supported (D-22/D-23)', () => {
      const category = punchManifest.categories.find(
        (c) => c.code === 'punch.missed_punch_manager',
      );
      expect(category).toBeDefined();
      expect(category!.defaultType).toBe(NotificationType.INFORMATIONAL);
      expect(category!.defaultPriority).toBe(NotificationPriority.HIGH);
      expect(category!.defaultChannels).toEqual([
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
        NotificationChannel.EMAIL,
      ]);
      expect(category!.digestSupported).toBe(false);
      expect(category!.name.length).toBeGreaterThan(0);
      expect(category!.description?.length ?? 0).toBeGreaterThan(0);
    });

    it('punch.missed_punch_employee is INFORMATIONAL/NORMAL/[IN_APP,PUSH,EMAIL], NOT digest-supported (D-21/D-22)', () => {
      const category = punchManifest.categories.find(
        (c) => c.code === 'punch.missed_punch_employee',
      );
      expect(category).toBeDefined();
      expect(category!.defaultType).toBe(NotificationType.INFORMATIONAL);
      expect(category!.defaultPriority).toBe(NotificationPriority.NORMAL);
      expect(category!.defaultChannels).toEqual([
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
        NotificationChannel.EMAIL,
      ]);
      expect(category!.digestSupported).toBe(false);
      expect(category!.name.length).toBeGreaterThan(0);
      expect(category!.description?.length ?? 0).toBeGreaterThan(0);
    });

    // ─── Phase 10 additions (Plan 10-01) ─────────────────────────────────────

    it('punch.agent_update_failed is ACTIONABLE/HIGH/[IN_APP,EMAIL], digest-supported (D-E1)', () => {
      const category = punchManifest.categories.find(
        (c) => c.code === 'punch.agent_update_failed',
      );
      expect(category).toBeDefined();
      expect(category!.defaultType).toBe(NotificationType.ACTIONABLE);
      expect(category!.defaultPriority).toBe(NotificationPriority.HIGH);
      expect(category!.defaultChannels).toEqual([
        NotificationChannel.IN_APP,
        NotificationChannel.EMAIL,
      ]);
      expect(category!.digestSupported).toBe(true);
      // pt-BR copy
      expect(category!.name.length).toBeGreaterThan(0);
      expect(category!.description?.length ?? 0).toBeGreaterThan(0);
    });

    it('every category code is unique (no accidental dup with phase-4/5/7/9/10 codes)', () => {
      const codes = punchManifest.categories.map((c) => c.code);
      const unique = new Set(codes);
      expect(unique.size).toBe(codes.length);
    });
  });
});
