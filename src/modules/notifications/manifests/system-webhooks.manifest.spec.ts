/**
 * Wave 0 spec stub — Phase 11 / Plan 11-01 ships the manifest itself; this
 * spec stays failing until Plan 11-02 wires the dispatcher consumer + verifies
 * end-to-end notification dispatch.
 */
import { describe, expect, it } from 'vitest';

import { systemWebhooksManifest } from './system-webhooks.manifest';

describe('systemWebhooksManifest contract (Plan 11-02 target)', () => {
  it("categoria 'system.webhook.delivery_failed' tem defaultType=ACTIONABLE, defaultPriority=HIGH", () => {
    const category = systemWebhooksManifest.categories.find(
      (c) => c.code === 'system.webhook.delivery_failed',
    );
    expect(category?.defaultType).toBe('ACTIONABLE');
    expect(category?.defaultPriority).toBe('HIGH');
    // Wave 0 sentinel: Plan 11-02 must add additional E2E coverage that the
    // dispatcher actually delivers a real notification when this category fires.
    expect(
      true,
      'Plan 11-02 must verify dispatcher integration end-to-end — sentinel fails Wave 0',
    ).toBe(false);
  });

  it('defaultChannels é EXATAMENTE [IN_APP, EMAIL] (não PUSH — admin-only)', () => {
    const category = systemWebhooksManifest.categories.find(
      (c) => c.code === 'system.webhook.delivery_failed',
    );
    expect(category?.defaultChannels).toEqual(['IN_APP', 'EMAIL']);
    expect(
      true,
      'Plan 11-02 must verify channels at delivery time match this manifest contract — no PUSH for admin-only category',
    ).toBe(false);
  });

  it('digestSupported === false (notificação imediata, não agrupar)', () => {
    const category = systemWebhooksManifest.categories.find(
      (c) => c.code === 'system.webhook.delivery_failed',
    );
    expect(category?.digestSupported).toBe(false);
    expect(
      true,
      'Plan 11-02 must verify scheduler does NOT accumulate this category in digest — DEAD/auto-disable is high-severity individual event',
    ).toBe(false);
  });
});
