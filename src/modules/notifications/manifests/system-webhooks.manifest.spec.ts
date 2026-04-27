/**
 * Phase 11 / Plan 11-02 — systemWebhooksManifest contract.
 *
 * V1 simplification A10/A11: manifest NÃO embeds URL declarativa; URL
 * vem em dispatch.data.url no dispatcher consumer (verificado em
 * webhook-delivery-failed-dispatcher-consumer.spec.ts).
 */
import { describe, expect, it } from 'vitest';

import { systemWebhooksManifest } from './system-webhooks.manifest';

describe('systemWebhooksManifest contract', () => {
  it("categoria 'system.webhook.delivery_failed' tem defaultType=ACTIONABLE, defaultPriority=HIGH", () => {
    const category = systemWebhooksManifest.categories.find(
      (c) => c.code === 'system.webhook.delivery_failed',
    );
    expect(category).toBeDefined();
    expect(category?.defaultType).toBe('ACTIONABLE');
    expect(category?.defaultPriority).toBe('HIGH');
  });

  it('defaultChannels é EXATAMENTE [IN_APP, EMAIL] (não PUSH — admin-only)', () => {
    const category = systemWebhooksManifest.categories.find(
      (c) => c.code === 'system.webhook.delivery_failed',
    );
    expect(category?.defaultChannels).toEqual(['IN_APP', 'EMAIL']);
  });

  it('digestSupported === false (notificação imediata, não agrupar)', () => {
    const category = systemWebhooksManifest.categories.find(
      (c) => c.code === 'system.webhook.delivery_failed',
    );
    expect(category?.digestSupported).toBe(false);
  });
});
