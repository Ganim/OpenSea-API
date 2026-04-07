import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Validate Portal Token (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should return 401 for invalid portal token', async () => {
    const response = await request(app.server).get(
      '/v1/public/customer-portal/invalid-token-123/validate',
    );

    expect(response.status).toBe(401);
  });

  it('should not require JWT authentication (public endpoint)', async () => {
    const response = await request(app.server).get(
      '/v1/public/customer-portal/some-token/validate',
    );

    // Should return 401 from invalid token, NOT from missing JWT
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  });
});
