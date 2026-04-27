/**
 * Phase 11 / Plan 11-02 — GET /v1/system/webhooks/:id/deliveries E2E.
 *
 * D-13: 4 filtros (status, periodo, eventType, httpStatus).
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('GET /v1/system/webhooks/:id/deliveries (E2E)', () => {
  let tenantId: string;
  let token: string;
  let tokenNoAccess: string;
  let webhookId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
    await app.ready();

    const t = await createAndSetupTenant();
    tenantId = t.tenantId;
    token = (await createAndAuthenticateUser(app, { tenantId })).token;
    tokenNoAccess = (
      await createAndAuthenticateUser(app, { tenantId, permissions: [] })
    ).token;

    const created = await request(app.server)
      .post('/v1/system/webhooks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        url: 'https://api.example.com/hook',
        subscribedEvents: ['punch.time-entry.created'],
      });
    webhookId = created.body.endpoint.id;

    // Seed 3 deliveries: 1 DELIVERED, 2 DEAD
    const baseDelivery = {
      tenantId,
      endpointId: webhookId,
      eventType: 'punch.time-entry.created',
      payloadHash: 'hash_x',
      attempts: [],
    };
    await prisma.webhookDelivery.create({
      data: {
        ...baseDelivery,
        eventId: 'evt_1',
        status: 'DELIVERED',
        lastHttpStatus: 200,
      },
    });
    await prisma.webhookDelivery.create({
      data: {
        ...baseDelivery,
        eventId: 'evt_2',
        status: 'DEAD',
        lastHttpStatus: 500,
      },
    });
    await prisma.webhookDelivery.create({
      data: {
        ...baseDelivery,
        eventId: 'evt_3',
        status: 'DEAD',
        lastHttpStatus: 503,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/system/webhooks/:id/deliveries com filtro status=DEAD retorna apenas DEAD', async () => {
    const res = await request(app.server)
      .get(`/v1/system/webhooks/${webhookId}/deliveries?status=DEAD`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const statuses = res.body.items.map((d: { status: string }) => d.status);
    expect(statuses.every((s: string) => s === 'DEAD')).toBe(true);
  });

  it('filtro période (createdAt range) + tipo de evento + HTTP status code (4 filtros — D-13)', async () => {
    const res = await request(app.server)
      .get(
        `/v1/system/webhooks/${webhookId}/deliveries?eventType=punch.time-entry.created&httpStatus=500`,
      )
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(
      res.body.items.every(
        (d: { lastHttpStatus: number }) => d.lastHttpStatus === 500,
      ),
    ).toBe(true);
  });

  it('RBAC: `system.webhooks.endpoints.access` é suficiente; sem code → 403', async () => {
    const res = await request(app.server)
      .get(`/v1/system/webhooks/${webhookId}/deliveries`)
      .set('Authorization', `Bearer ${tokenNoAccess}`);
    expect(res.status).toBe(403);
  });
});
