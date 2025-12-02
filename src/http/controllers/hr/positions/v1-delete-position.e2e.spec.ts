import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createPositionE2E } from '@/utils/tests/factories/hr/create-position.e2e';

describe('Delete Position (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to delete a position', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { positionId } = await createPositionE2E();

    const response = await request(app.server)
      .delete(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('deleted');
  });

  it('should allow ADMIN to delete a position', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const { positionId } = await createPositionE2E();

    const response = await request(app.server)
      .delete(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toContain('deleted');
  });

  it('should NOT allow USER to delete a position', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { positionId } = await createPositionE2E();

    const response = await request(app.server)
      .delete(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const { positionId } = await createPositionE2E();

    const response = await request(app.server).delete(
      `/v1/hr/positions/${positionId}`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 when position is not found', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .delete(`/v1/hr/positions/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 400 when ID is invalid', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const invalidId = 'invalid-uuid';

    const response = await request(app.server)
      .delete(`/v1/hr/positions/${invalidId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
  });

  it('should not find position after deletion', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { positionId } = await createPositionE2E();

    // Delete
    await request(app.server)
      .delete(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`);

    // Try to get
    const response = await request(app.server)
      .get(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });
});
