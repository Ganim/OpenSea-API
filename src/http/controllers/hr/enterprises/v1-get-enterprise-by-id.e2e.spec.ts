import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generateEnterpriseData } from '@/utils/tests/factories/hr/create-enterprise.e2e';

describe('Get Enterprise By ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get an enterprise by ID', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const enterpriseData = generateEnterpriseData();

    const createResponse = await request(app.server)
      .post('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${token}`)
      .send(enterpriseData);

    const enterpriseId = createResponse.body.enterprise.id;

    const response = await request(app.server)
      .get(`/v1/hr/enterprises/${enterpriseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.enterprise).toBeDefined();
    expect(response.body.enterprise.id).toBe(enterpriseId);
    expect(response.body.enterprise.legalName).toBe(enterpriseData.legalName);
  });

  it('should return null when enterprise is not found', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const fakeId = '550e8400-e29b-41d4-a716-446655440000';

    const response = await request(app.server)
      .get(`/v1/hr/enterprises/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.enterprise).toBeNull();
  });

  it('should return 401 when no token is provided', async () => {
    const fakeId = '550e8400-e29b-41d4-a716-446655440000';

    const response = await request(app.server).get(
      `/v1/hr/enterprises/${fakeId}`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when ID format is invalid', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .get('/v1/hr/enterprises/invalid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
  });
});
