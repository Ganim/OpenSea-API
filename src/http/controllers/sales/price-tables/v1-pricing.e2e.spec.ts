import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Pricing E2E (Price Tables, Campaigns, Coupons)', () => {
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId } = await createAndSetupTenant();

    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  // ── Price Tables ────────────────────────────────────────────────────────────

  it('POST /v1/price-tables should create a price table (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/price-tables')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Price Table ${timestamp}`,
        description: 'E2E pricing test',
        type: 'RETAIL',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('priceTable');
    expect(response.body.priceTable).toHaveProperty('id');
    expect(response.body.priceTable.name).toContain('Price Table');
  });

  it('GET /v1/price-tables should list price tables (200)', async () => {
    const response = await request(app.server)
      .get('/v1/price-tables')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('priceTables');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.priceTables)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
  });

  // ── Campaigns ───────────────────────────────────────────────────────────────

  it('POST /v1/campaigns should create a campaign (201)', async () => {
    const timestamp = Date.now();
    const startDate = new Date();
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days

    const response = await request(app.server)
      .post('/v1/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Campaign ${timestamp}`,
        type: 'PERCENTAGE',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        channels: ['WEB'],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('campaign');
    expect(response.body.campaign).toHaveProperty('id');
    expect(response.body.campaign.name).toContain('Campaign');
    expect(response.body.campaign.type).toBe('PERCENTAGE');
  });

  it('GET /v1/campaigns should list campaigns (200)', async () => {
    const response = await request(app.server)
      .get('/v1/campaigns')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('campaigns');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.campaigns)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
  });

  // ── Coupons ─────────────────────────────────────────────────────────────────

  it('POST /v1/coupons should create a coupon (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/coupons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `COUPON${timestamp}`,
        type: 'PERCENTAGE',
        value: 10,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('coupon');
    expect(response.body.coupon).toHaveProperty('id');
    expect(response.body.coupon.code).toContain('COUPON');
    expect(response.body.coupon.type).toBe('PERCENTAGE');
  });

  it('GET /v1/coupons should list coupons (200)', async () => {
    const response = await request(app.server)
      .get('/v1/coupons')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('coupons');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.coupons)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
  });
});
