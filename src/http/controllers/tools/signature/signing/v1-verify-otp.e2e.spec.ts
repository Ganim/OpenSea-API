import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Verify OTP (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should return 404 for invalid signing token', async () => {
    const response = await request(app.server)
      .post('/v1/signature/sign/invalid-token-abc123/otp/verify')
      .send({ otpCode: '123456' });

    expect(response.status).toBe(404);
  });

  it('should return 400 for malformed OTP', async () => {
    const response = await request(app.server)
      .post('/v1/signature/sign/some-token/otp/verify')
      .send({ otpCode: 'abc' });

    expect(response.status).toBe(400);
  });

  it('should not require JWT authentication (public endpoint)', async () => {
    const response = await request(app.server)
      .post('/v1/signature/sign/some-token/otp/verify')
      .send({ otpCode: '123456' });

    // Should return 404 from invalid token, NOT 401 from missing JWT
    expect(response.status).not.toBe(401);
  });
});
