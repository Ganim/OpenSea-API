import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import {
  generatePositionCode,
  generatePositionData,
} from '@/utils/tests/factories/hr/create-position.e2e';

describe('Create Position (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to create a new position', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const positionData = generatePositionData();

    const response = await request(app.server)
      .post('/v1/hr/positions')
      .set('Authorization', `Bearer ${token}`)
      .send(positionData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('position');
    expect(response.body.position).toMatchObject({
      name: positionData.name,
      code: positionData.code,
      level: positionData.level,
      isActive: positionData.isActive,
    });
    expect(response.body.position.id).toBeDefined();
  });

  it('should allow ADMIN to create a new position', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const positionData = generatePositionData();

    const response = await request(app.server)
      .post('/v1/hr/positions')
      .set('Authorization', `Bearer ${token}`)
      .send(positionData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('position');
    expect(response.body.position.name).toBe(positionData.name);
  });

  it('should NOT allow USER to create a position', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const positionData = generatePositionData();

    const response = await request(app.server)
      .post('/v1/hr/positions')
      .set('Authorization', `Bearer ${token}`)
      .send(positionData);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const positionData = generatePositionData();

    const response = await request(app.server)
      .post('/v1/hr/positions')
      .send(positionData);

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when code is already registered', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const code = generatePositionCode();

    const firstPosition = generatePositionData({ code });
    await request(app.server)
      .post('/v1/hr/positions')
      .set('Authorization', `Bearer ${token}`)
      .send(firstPosition);

    const secondPosition = generatePositionData({ code });

    const response = await request(app.server)
      .post('/v1/hr/positions')
      .set('Authorization', `Bearer ${token}`)
      .send(secondPosition);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('code already exists');
  });

  it('should return 400 when required fields are missing', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .post('/v1/hr/positions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        // Missing required fields: name, code
      });

    expect(response.statusCode).toBe(400);
  });

  it('should create position with salary range', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const positionData = generatePositionData({
      minSalary: 3000,
      maxSalary: 8000,
    });

    const response = await request(app.server)
      .post('/v1/hr/positions')
      .set('Authorization', `Bearer ${token}`)
      .send(positionData);

    expect(response.statusCode).toBe(201);
    expect(response.body.position.minSalary).toBe(3000);
    expect(response.body.position.maxSalary).toBe(8000);
  });

  it('should return 400 when minSalary is greater than maxSalary', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const positionData = generatePositionData({
      minSalary: 10000,
      maxSalary: 5000,
    });

    const response = await request(app.server)
      .post('/v1/hr/positions')
      .set('Authorization', `Bearer ${token}`)
      .send(positionData);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('salary');
  });

  it('should create inactive position', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const positionData = generatePositionData({ isActive: false });

    const response = await request(app.server)
      .post('/v1/hr/positions')
      .set('Authorization', `Bearer ${token}`)
      .send(positionData);

    expect(response.statusCode).toBe(201);
    expect(response.body.position.isActive).toBe(false);
  });
});
