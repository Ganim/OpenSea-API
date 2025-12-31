import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Force Password Reset (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow ADMIN to force password reset for a user', async () => {
    const { token: adminToken } = await createAndAuthenticateUser(app);
    const { user: targetUserResponse } = await createAndAuthenticateUser(app, { permissions: [] },
    );

    const response = await request(app.server)
      .post(`/v1/users/${targetUserResponse.user.id}/force-password-reset`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reason: 'Security policy compliance',
        sendEmail: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('successfully');
    expect(response.body.user.forcePasswordReset).toBe(true);
    expect(response.body.user.forcePasswordResetReason).toBe(
      'Security policy compliance',
    );

    // Verify in database
    const updatedUser = await prisma.user.findUnique({
      where: { id: targetUserResponse.user.id },
    });
    expect(updatedUser?.forcePasswordReset).toBe(true);
  });

  it('should allow MANAGER with permission to force password reset', async () => {
    const { token: managerToken } = await createAndAuthenticateUser(
      app,
    );
    const { user: targetUserResponse } = await createAndAuthenticateUser(app, { permissions: [] },
    );

    const response = await request(app.server)
      .post(`/v1/users/${targetUserResponse.user.id}/force-password-reset`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        sendEmail: false,
      });

    expect(response.status).toBe(200);
  });

  it('should NOT allow USER without permission to force password reset', async () => {
    const { token: userToken } = await createAndAuthenticateUser(app);
    const { user: targetUserResponse } = await createAndAuthenticateUser(app, { permissions: [] },
    );

    const response = await request(app.server)
      .post(`/v1/users/${targetUserResponse.user.id}/force-password-reset`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        sendEmail: false,
      });

    expect(response.status).toBe(403);
  });

  it('should return 401 if not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/users/some-user-id/force-password-reset')
      .send({
        sendEmail: false,
      });

    expect(response.status).toBe(401);
  });

  it('should return 404 if user not found', async () => {
    const { token: adminToken } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/users/00000000-0000-0000-0000-000000000000/force-password-reset')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sendEmail: false,
      });

    expect(response.status).toBe(404);
  });

  it('should return 400 if user already has pending reset', async () => {
    const { token: adminToken } = await createAndAuthenticateUser(app);
    const { user: targetUserResponse } = await createAndAuthenticateUser(app, { permissions: [] },
    );

    // First request - should succeed
    await request(app.server)
      .post(`/v1/users/${targetUserResponse.user.id}/force-password-reset`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sendEmail: false });

    // Second request - should fail
    const response = await request(app.server)
      .post(`/v1/users/${targetUserResponse.user.id}/force-password-reset`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sendEmail: false });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('pending');
  });

  it('should block login when forced reset is pending', async () => {
    const { token: adminToken } = await createAndAuthenticateUser(app);

    const uniqueId = Math.random().toString(36).substring(2, 10);
    const testEmail = `forcedresettest${uniqueId}@test.com`;
    const testPassword = 'TestPass@123';

    // Create user directly via API
    const createResponse = await request(app.server)
      .post('/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: testEmail,
        password: testPassword,
        username: `forcedtest${uniqueId}`,
      });

    expect(createResponse.status).toBe(201);
    const userId = createResponse.body.user.id;

    // Force password reset
    const forceResetResponse = await request(app.server)
      .post(`/v1/users/${userId}/force-password-reset`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reason: 'Test reason',
        sendEmail: false,
      });

    expect(forceResetResponse.status).toBe(200);

    // Try to login - should be blocked
    const loginResponse = await request(app.server)
      .post('/v1/auth/login/password')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(loginResponse.status).toBe(403);
    expect(loginResponse.body.code).toBe('PASSWORD_RESET_REQUIRED');
    expect(loginResponse.body.resetToken).toBeDefined();
    expect(loginResponse.body.reason).toBe('Test reason');
  });

  it('should clear forced reset after password is changed', async () => {
    const { token: adminToken } = await createAndAuthenticateUser(app);

    const uniqueId = Math.random().toString(36).substring(2, 10);
    const testEmail = `clearresettest${uniqueId}@test.com`;
    const testPassword = 'TestPass@123';
    const newPassword = 'NewPass@456';

    // Create user
    const createResponse = await request(app.server)
      .post('/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: testEmail,
        password: testPassword,
        username: `cleartest${uniqueId}`,
      });

    const userId = createResponse.body.user.id;

    // Force password reset
    await request(app.server)
      .post(`/v1/users/${userId}/force-password-reset`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sendEmail: false });

    // Try to login and get reset token
    const blockedLoginResponse = await request(app.server)
      .post('/v1/auth/login/password')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(blockedLoginResponse.status).toBe(403);
    const { resetToken } = blockedLoginResponse.body;

    // Reset password using the token
    const resetResponse = await request(app.server)
      .post('/v1/auth/reset/password')
      .send({
        token: resetToken,
        password: newPassword,
      });

    expect(resetResponse.status).toBe(200);

    // Verify forced reset is cleared in database
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.forcePasswordReset).toBe(false);
    expect(user?.forcePasswordResetReason).toBeNull();

    // Should be able to login now with new password
    const successLoginResponse = await request(app.server)
      .post('/v1/auth/login/password')
      .send({
        email: testEmail,
        password: newPassword,
      });

    expect(successLoginResponse.status).toBe(200);
    expect(successLoginResponse.body.token).toBeDefined();
  });

  it('should work without reason (optional field)', async () => {
    const { token: adminToken } = await createAndAuthenticateUser(app);
    const { user: targetUserResponse } = await createAndAuthenticateUser(app, { permissions: [] },
    );

    const response = await request(app.server)
      .post(`/v1/users/${targetUserResponse.user.id}/force-password-reset`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sendEmail: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.user.forcePasswordResetReason).toBeNull();
  });

  it('should respect sendEmail flag', async () => {
    const { token: adminToken } = await createAndAuthenticateUser(app);
    const { user: targetUserResponse } = await createAndAuthenticateUser(app, { permissions: [] },
    );

    const response = await request(app.server)
      .post(`/v1/users/${targetUserResponse.user.id}/force-password-reset`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reason: 'With email notification',
        sendEmail: true,
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('email sent');
  });
});
