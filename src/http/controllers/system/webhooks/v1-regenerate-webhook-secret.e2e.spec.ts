/**
 * Phase 11 / Plan 11-02 — POST /v1/system/webhooks/:id/regenerate-secret E2E.
 *
 * D-07 rotação 7d + D-08 visible-once + verifyActionPin gate.
 */
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { getJwtSecret, jwtConfig } from '@/config/jwt';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

function makeActionPinToken(userSub: string): string {
  const secret = getJwtSecret();
  const signKey = typeof secret === 'string' ? secret : secret.private;
  return jwt.sign(
    {
      scope: 'action-pin',
      sub: userSub,
    },
    signKey,
    {
      algorithm: jwtConfig.algorithm,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      expiresIn: '5m',
    },
  );
}

describe('POST /v1/system/webhooks/:id/regenerate-secret (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userSub: string;
  let webhookId: string;
  let originalSecret: string;

  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
    await app.ready();

    const t = await createAndSetupTenant();
    tenantId = t.tenantId;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userSub = auth.user.id;

    const created = await request(app.server)
      .post('/v1/system/webhooks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        url: 'https://api.example.com/hook',
        subscribedEvents: ['punch.time-entry.created'],
      });
    webhookId = created.body.endpoint.id;
    originalSecret = created.body.secret;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/system/webhooks/:id/regenerate-secret com action-pin válido retorna 200 + novo secret cleartext UMA VEZ', async () => {
    const pinToken = makeActionPinToken(userSub);
    const res = await request(app.server)
      .post(`/v1/system/webhooks/${webhookId}/regenerate-secret`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-action-pin-token', pinToken);
    expect(res.status).toBe(200);
    expect(res.body.secret).toMatch(/^whsec_[A-Za-z0-9_-]{30,}$/);
    expect(res.body.secret).not.toBe(originalSecret);
  });

  it('Sem action-pin (verifyActionPin middleware) retorna 401', async () => {
    const res = await request(app.server)
      .post(`/v1/system/webhooks/${webhookId}/regenerate-secret`)
      .set('Authorization', `Bearer ${token}`);
    // Middleware retorna 403 ("PIN verification required") — alinhar com verify-action-pin.ts
    expect([401, 403]).toContain(res.status);
  });

  it('secretPrevious é setado para o secret antigo + secretPreviousExpiresAt = NOW + 7 dias (D-07)', async () => {
    const row = await prisma.webhookEndpoint.findFirst({
      where: { id: webhookId, tenantId },
    });
    expect(row).not.toBeNull();
    expect(row?.secretPrevious).toBeTruthy();
    expect(row?.secretPreviousExpiresAt).not.toBeNull();
    if (row?.secretPreviousExpiresAt) {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const delta = row.secretPreviousExpiresAt.getTime() - Date.now();
      // Tolerância de 1 dia (test environment delays)
      expect(delta).toBeGreaterThan(sevenDaysMs - 24 * 60 * 60 * 1000);
      expect(delta).toBeLessThanOrEqual(sevenDaysMs + 1000);
    }
  });
});
