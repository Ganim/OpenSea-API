import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Get Payment Link Public (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should return 404 for non-existent payment link slug', async () => {
    const response = await request(app.server).get('/v1/pay/nonexistent-slug');

    expect(response.status).toBe(404);
  });

  it('should not require authentication (public endpoint)', async () => {
    const response = await request(app.server).get('/v1/pay/any-slug');

    // Should not return 401 — public endpoint
    expect(response.status).not.toBe(401);
  });
});
