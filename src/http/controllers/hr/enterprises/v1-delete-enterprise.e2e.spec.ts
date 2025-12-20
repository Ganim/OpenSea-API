import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generateEnterpriseData } from '@/utils/tests/factories/hr/create-enterprise.e2e';

describe('Delete Enterprise (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to delete an enterprise', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const enterpriseData = generateEnterpriseData();

    const createResponse = await request(app.server)
      .post('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${token}`)
      .send(enterpriseData);

    const enterpriseId = createResponse.body.enterprise.id;

    const response = await request(app.server)
      .delete(`/v1/hr/enterprises/${enterpriseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should NOT allow USER to delete an enterprise', async () => {
    const { token: managerToken } = await createAndAuthenticateUser(
      app,
      'MANAGER',
    );
    const { token: userToken } = await createAndAuthenticateUser(app, 'USER');

    const createResponse = await request(app.server)
      .post('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(generateEnterpriseData());

    const enterpriseId = createResponse.body.enterprise.id;

    const response = await request(app.server)
      .delete(`/v1/hr/enterprises/${enterpriseId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const fakeId = '550e8400-e29b-41d4-a716-446655440000';

    const response = await request(app.server).delete(
      `/v1/hr/enterprises/${fakeId}`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should soft delete enterprise (not return it in queries)', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const enterpriseData = generateEnterpriseData();

    const createResponse = await request(app.server)
      .post('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${token}`)
      .send(enterpriseData);

    const enterpriseId = createResponse.body.enterprise.id;

    // Delete the enterprise
    await request(app.server)
      .delete(`/v1/hr/enterprises/${enterpriseId}`)
      .set('Authorization', `Bearer ${token}`);

    // Try to get the deleted enterprise
    const getResponse = await request(app.server)
      .get(`/v1/hr/enterprises/${enterpriseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body.enterprise).toBeNull();
  });
});
