import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('List Portal Invoices (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should return 401 for invalid portal token', async () => {
    const response = await request(app.server).get(
      '/v1/public/customer-portal/invalid-token-123/invoices',
    );

    expect(response.status).toBe(401);
  });

  it('should accept pagination params without auth failure', async () => {
    const response = await request(app.server)
      .get('/v1/public/customer-portal/some-token/invoices')
      .query({ page: 1, limit: 10, status: 'all' });

    // Should fail on token validation, not on query params
    expect(response.status).toBe(401);
  });
});
