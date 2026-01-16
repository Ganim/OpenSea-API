import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { makeUniqueEmail } from '@/utils/tests/factories/core/make-unique-email';

describe('Reset Password By Token (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reset password by token with correct schema', async () => {
    const email = makeUniqueEmail('reset-pwd');
    const uniqueId = Math.random().toString(36).substring(2, 10);

    await request(app.server).post('/v1/auth/register/password').send({
      email,
      password: 'OldPass@123',
    });

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    const token = `reset-token-${uniqueId}`;
    await prisma.user.update({
      where: { id: user!.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    const response = await request(app.server)
      .post('/v1/auth/reset/password')
      .send({
        token,
        newPassword: 'NewPass@123',
      });

    expect(response.status).toBe(200);
  });
});
