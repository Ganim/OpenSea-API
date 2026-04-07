import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Get Auth Methods (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should return available authentication methods', async () => {
    const response = await request(app.server).get('/v1/auth/methods');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('methods');
    expect(response.body).toHaveProperty('magicLinkEnabled');
    expect(response.body).toHaveProperty('defaultMethod');
    expect(Array.isArray(response.body.methods)).toBe(true);
  });

  it('should accept optional tenantId query parameter', async () => {
    const response = await request(app.server)
      .get('/v1/auth/methods')
      .query({ tenantId: '00000000-0000-0000-0000-000000000000' });

    // Should still return 200 even with non-existent tenant (returns defaults)
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('methods');
  });
});
