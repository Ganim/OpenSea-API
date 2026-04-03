import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Get Signing Page (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });


  it('should return 404 for invalid signing token', async () => {
    const response = await request(app.server).get(
      '/v1/signature/sign/invalid-token-abc123',
    );

    expect(response.status).toBe(404);
  });

  it('should not require JWT authentication (public endpoint)', async () => {
    const response = await request(app.server).get(
      '/v1/signature/sign/some-token',
    );

    // Should return 404 from invalid token, NOT 401 from missing JWT
    expect(response.status).not.toBe(401);
  });
});
