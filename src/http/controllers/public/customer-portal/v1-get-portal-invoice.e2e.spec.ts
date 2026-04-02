import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Get Portal Invoice (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 for invalid portal token', async () => {
    const response = await request(app.server).get(
      '/v1/public/customer-portal/invalid-token/invoices/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });

  it('should not require JWT authentication (public endpoint)', async () => {
    const response = await request(app.server).get(
      '/v1/public/customer-portal/some-token/invoices/00000000-0000-0000-0000-000000000000',
    );

    // Should return 401 from invalid portal token, NOT from missing JWT
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  });
});
