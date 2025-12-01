import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createPositionE2E } from '@/utils/tests/factories/hr/create-position.e2e';

describe('Get Position By ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to get position by ID', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { position, positionId } = await createPositionE2E();

    const response = await request(app.server)
      .get(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('position');
    expect(response.body.position.id).toBe(positionId);
    expect(response.body.position.name).toBe(position.name);
    expect(response.body.position.code).toBe(position.code);
  });

  it('should allow ADMIN to get position by ID', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const { positionId } = await createPositionE2E();

    const response = await request(app.server)
      .get(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('position');
  });

  it('should allow USER to get position by ID', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { positionId } = await createPositionE2E();

    const response = await request(app.server)
      .get(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('position');
  });

  it('should return 401 when no token is provided', async () => {
    const { positionId } = await createPositionE2E();

    const response = await request(app.server).get(
      `/v1/hr/positions/${positionId}`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 when position is not found', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/hr/positions/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 400 when ID is invalid', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const invalidId = 'invalid-uuid';

    const response = await request(app.server)
      .get(`/v1/hr/positions/${invalidId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
  });

  it('should return position with all fields', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { positionId } = await createPositionE2E({
      description: 'Test description',
      minSalary: 3000,
      maxSalary: 8000,
    });

    const response = await request(app.server)
      .get(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.position).toHaveProperty('id');
    expect(response.body.position).toHaveProperty('name');
    expect(response.body.position).toHaveProperty('code');
    expect(response.body.position).toHaveProperty('description');
    expect(response.body.position).toHaveProperty('level');
    expect(response.body.position).toHaveProperty('minSalary');
    expect(response.body.position).toHaveProperty('maxSalary');
    expect(response.body.position).toHaveProperty('isActive');
    expect(response.body.position).toHaveProperty('createdAt');
    expect(response.body.position).toHaveProperty('updatedAt');
  });
});
