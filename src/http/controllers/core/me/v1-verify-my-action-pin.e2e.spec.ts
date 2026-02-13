import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Verify My Action PIN (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return valid true for correct action PIN', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // First, set an action PIN
    await request(app.server)
      .patch('/v1/me/action-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Pass@123',
        newActionPin: '5678',
      });

    // Then verify it
    const response = await request(app.server)
      .post('/v1/me/verify-action-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({ actionPin: '5678' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ valid: true });
  });

  it('should return valid false for wrong action PIN', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // First, set an action PIN
    await request(app.server)
      .patch('/v1/me/action-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Pass@123',
        newActionPin: '5678',
      });

    // Then verify with wrong PIN
    const response = await request(app.server)
      .post('/v1/me/verify-action-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({ actionPin: '0000' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ valid: false });
  });

  it('should return 400 when action PIN is not configured', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Do NOT set an action PIN, try to verify directly
    const response = await request(app.server)
      .post('/v1/me/verify-action-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({ actionPin: '1234' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app.server)
      .post('/v1/me/verify-action-pin')
      .send({ actionPin: '1234' });

    expect(response.status).toBe(401);
  });
});
