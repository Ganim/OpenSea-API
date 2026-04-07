import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Get Accountant DRE (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should return 401 without accountant token', async () => {
    const response = await request(app.server)
      .get('/v1/accountant/reports/dre')
      .query({ year: 2025 });

    expect(response.status).toBe(401);
  });

  it('should return 401 with invalid accountant token', async () => {
    const response = await request(app.server)
      .get('/v1/accountant/reports/dre')
      .set('Authorization', 'Bearer invalid-token-123')
      .query({ year: 2025 });

    expect(response.status).toBe(401);
  });
});
