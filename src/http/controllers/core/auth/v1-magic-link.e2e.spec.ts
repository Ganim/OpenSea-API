import crypto from 'crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { makeUniqueEmail } from '@/utils/tests/factories/core/make-unique-email';

describe('Magic Link (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });


  it('should request magic link for valid email', async () => {
    const email = makeUniqueEmail('magic-req');

    // Register user first
    await request(app.server).post('/v1/auth/register/password').send({
      email,
      password: 'Pass@123',
    });

    const response = await request(app.server)
      .post('/v1/auth/magic-link/request')
      .send({ identifier: email });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });

  it('should return generic message for non-existent identifier', async () => {
    const response = await request(app.server)
      .post('/v1/auth/magic-link/request')
      .send({ identifier: 'nonexistent@example.com' });

    // Always 200 — no user enumeration
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });

  it('should verify magic link and return token', async () => {
    const email = makeUniqueEmail('magic-verify');

    // Register user
    await request(app.server).post('/v1/auth/register/password').send({
      email,
      password: 'Pass@123',
    });

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    expect(user).toBeTruthy();

    // Generate a raw token and its hash
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // Store hashed token in DB
    await prisma.magicLinkToken.create({
      data: {
        userId: user!.id,
        token: hashedToken,
        email: email.toLowerCase(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min from now
      },
    });

    // Verify with the raw token
    const response = await request(app.server)
      .post('/v1/auth/magic-link/verify')
      .send({ token: rawToken });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body).toHaveProperty('sessionId');
  });

  it('should reject expired magic link', async () => {
    const email = makeUniqueEmail('magic-expired');

    // Register user
    await request(app.server).post('/v1/auth/register/password').send({
      email,
      password: 'Pass@123',
    });

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    expect(user).toBeTruthy();

    // Create expired token
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
        expiresAt: new Date(Date.now() - 60 * 1000), // expired 1 min ago
      },
    });

    const response = await request(app.server)
      .post('/v1/auth/magic-link/verify')
      .send({ token: rawToken });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('should reject already-used magic link', async () => {
    const email = makeUniqueEmail('magic-used');

    // Register user
    await request(app.server).post('/v1/auth/register/password').send({
      email,
      password: 'Pass@123',
    });

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    expect(user).toBeTruthy();

    // Create already-used token
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
        usedAt: new Date(), // already used
      },
    });

    const response = await request(app.server)
      .post('/v1/auth/magic-link/verify')
      .send({ token: rawToken });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });
});
