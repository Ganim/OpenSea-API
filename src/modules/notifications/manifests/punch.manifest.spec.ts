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
    it('declares exactly 3 categories', () => {
      expect(punchManifest.categories).toHaveLength(3);
    });

    it('declares the expected category codes in order', () => {
      const codes = punchManifest.categories.map((c) => c.code);
      expect(codes).toEqual([
        'punch.registered',
        'punch.late',
        'punch.approval_requested',
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
  });
});
