import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Get Public Admission (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should return 404 for non-existent admission token', async () => {
    const response = await request(app.server).get(
      '/v1/public/admission/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(404);
  });

  it('should not require authentication (public endpoint)', async () => {
    const response = await request(app.server).get(
      '/v1/public/admission/00000000-0000-0000-0000-000000000000',
    );

    // Should not return 401 — public endpoint
    expect(response.status).not.toBe(401);
  });

  it('should validate token is a UUID', async () => {
    const response = await request(app.server).get(
      '/v1/public/admission/not-a-uuid',
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
