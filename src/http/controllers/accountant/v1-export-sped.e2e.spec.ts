import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Export SPED (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 without accountant token', async () => {
    const response = await request(app.server)
      .get('/v1/accountant/export/sped')
      .query({ year: 2025, format: 'ECD' });

    expect(response.status).toBe(401);
  });

  it('should return 401 with invalid accountant token', async () => {
    const response = await request(app.server)
      .get('/v1/accountant/export/sped')
      .set('Authorization', 'Bearer invalid-token-123')
      .query({ year: 2025, format: 'ECD' });

    expect(response.status).toBe(401);
  });
});
