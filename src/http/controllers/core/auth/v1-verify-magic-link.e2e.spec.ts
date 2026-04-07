import crypto from 'crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { makeUniqueEmail } from '@/utils/tests/factories/core/make-unique-email';

describe('Verify Magic Link (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should verify a valid magic link token', async () => {
    const email = makeUniqueEmail('verify-ml');

    await request(app.server).post('/v1/auth/register/password').send({
      email,
      password: 'Pass@123',
    });

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    expect(user).toBeTruthy();

    const rawToken = crypto.randomBytes(32).toString('base64url');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await prisma.magicLinkToken.create({
      data: {
        userId: user!.id,
        token: hashedToken,
        email: email.toLowerCase(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const response = await request(app.server)
      .post('/v1/auth/magic-link/verify')
      .send({ token: rawToken });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body).toHaveProperty('sessionId');
  });

  it('should reject invalid magic link token', async () => {
    const response = await request(app.server)
      .post('/v1/auth/magic-link/verify')
      .send({ token: 'invalid-token-value' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });
});
