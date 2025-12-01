import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import {
  createPositionE2E,
  generatePositionCode,
} from '@/utils/tests/factories/hr/create-position.e2e';

describe('Update Position (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to update a position', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { positionId } = await createPositionE2E();
    const updateData = { name: 'Updated Position Name' };

    const response = await request(app.server)
      .put(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('position');
    expect(response.body.position.name).toBe(updateData.name);
  });

  it('should allow ADMIN to update a position', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const { positionId } = await createPositionE2E();
    const updateData = { description: 'Updated description' };

    const response = await request(app.server)
      .put(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.statusCode).toBe(200);
    expect(response.body.position.description).toBe(updateData.description);
  });

  it('should NOT allow USER to update a position', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { positionId } = await createPositionE2E();
    const updateData = { name: 'Should Not Work' };

    const response = await request(app.server)
      .put(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const { positionId } = await createPositionE2E();
    const updateData = { name: 'No Auth' };

    const response = await request(app.server)
      .put(`/v1/hr/positions/${positionId}`)
      .send(updateData);

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 when position is not found', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const updateData = { name: 'Not Found' };

    const response = await request(app.server)
      .put(`/v1/hr/positions/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.statusCode).toBe(404);
  });

  it('should return 400 when updating to existing code', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { code: existingCode } = await createPositionE2E();
    const { positionId } = await createPositionE2E();

    const response = await request(app.server)
      .put(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ code: existingCode });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('code already exists');
  });

  it('should update position salary range', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { positionId } = await createPositionE2E();

    const response = await request(app.server)
      .put(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ minSalary: 4000, maxSalary: 12000 });

    expect(response.statusCode).toBe(200);
    expect(response.body.position.minSalary).toBe(4000);
    expect(response.body.position.maxSalary).toBe(12000);
  });

  it('should return 400 when minSalary is greater than maxSalary', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { positionId } = await createPositionE2E();

    const response = await request(app.server)
      .put(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ minSalary: 15000, maxSalary: 5000 });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('salary');
  });

  it('should update position code successfully', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { positionId } = await createPositionE2E();
    const newCode = generatePositionCode();

    const response = await request(app.server)
      .put(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ code: newCode });

    expect(response.statusCode).toBe(200);
    expect(response.body.position.code).toBe(newCode);
  });
});
