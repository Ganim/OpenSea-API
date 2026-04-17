import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Request OTP (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should return 404 for invalid signing token', async () => {
    const response = await request(app.server).post(
      '/v1/signature/sign/invalid-token-abc123/otp',
    );

    expect(response.status).toBe(404);
  });

  it('should not require JWT authentication (public endpoint)', async () => {
    const response = await request(app.server).post(
      '/v1/signature/sign/some-token/otp',
    );

    // Should return 404 from invalid token, NOT 401 from missing JWT
    expect(response.status).not.toBe(401);
  });
});
