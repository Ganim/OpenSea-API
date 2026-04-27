/**
 * Phase 11 / Plan 11-02 — POST /v1/system/webhooks E2E.
 *
 * Cobre: 201 (happy path) + 403 (RBAC) + cross-tenant guard (D-35) + LGPD sentinel.
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('POST /v1/system/webhooks (E2E)', () => {
  let tenantA: string;
  let tenantB: string;
  let tokenA: string;
  let tokenB: string;
  let tokenAWithoutPerms: string;

  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
    await app.ready();

    const a = await createAndSetupTenant();
    tenantA = a.tenantId;
    const b = await createAndSetupTenant();
    tenantB = b.tenantId;

    tokenA = (await createAndAuthenticateUser(app, { tenantId: tenantA }))
      .token;
    tokenB = (await createAndAuthenticateUser(app, { tenantId: tenantB }))
      .token;
    tokenAWithoutPerms = (
      await createAndAuthenticateUser(app, {
        tenantId: tenantA,
        permissions: [],
      })
    ).token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/system/webhooks com URL/eventos/description retorna 201 + body.secret cleartext', async () => {
    const res = await request(app.server)
      .post('/v1/system/webhooks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        url: 'https://api.example.com/hook',
        description: 'demo webhook',
        subscribedEvents: ['punch.time-entry.created'],
      });

    expect(res.status).toBe(201);
    expect(res.body.secret).toMatch(/^whsec_[A-Za-z0-9_-]{30,}$/);
    expect(res.body.endpoint.secretMasked).toMatch(/^whsec_••••••••.{4}$/);
  });

  it('RBAC: usuário sem `system.webhooks.endpoints.register` recebe 403', async () => {
    const res = await request(app.server)
      .post('/v1/system/webhooks')
      .set('Authorization', `Bearer ${tokenAWithoutPerms}`)
      .send({
        url: 'https://api.example.com/hook',
        subscribedEvents: ['punch.time-entry.created'],
      });
    expect(res.status).toBe(403);
  });

  it('Cross-tenant: webhook criado em tenant A não aparece em GET /v1/system/webhooks de tenant B (D-35)', async () => {
    await request(app.server)
      .post('/v1/system/webhooks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        url: 'https://api.tenant-a.example.com/hook',
        subscribedEvents: ['punch.time-entry.created'],
      });

    const res = await request(app.server)
      .get('/v1/system/webhooks')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(200);
    const urls: string[] = res.body.items.map((e: { url: string }) => e.url);
    expect(urls).not.toContain('https://api.tenant-a.example.com/hook');
  });

  it('LGPD sentinel: response body do GET não contém regex /whsec_[A-Za-z0-9_-]{30,}/ (secret nunca após criação)', async () => {
    const list = await request(app.server)
      .get('/v1/system/webhooks')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(list.status).toBe(200);
    const serialized = JSON.stringify(list.body);
    expect(serialized.match(/whsec_[A-Za-z0-9_-]{30,}/)).toBeNull();
  });
});
