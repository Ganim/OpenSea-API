import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generateEnterpriseData } from '@/utils/tests/factories/hr/create-enterprise.e2e';

describe('Update Enterprise (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to update an enterprise', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const enterpriseData = generateEnterpriseData();

    const createResponse = await request(app.server)
      .post('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${token}`)
      .send(enterpriseData);

    const enterpriseId = createResponse.body.enterprise.id;

    const response = await request(app.server)
      .put(`/v1/hr/enterprises/${enterpriseId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: 'Updated Enterprise Name',
        taxRegime: 'Simples Nacional',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.enterprise.legalName).toBe('Updated Enterprise Name');
    expect(response.body.enterprise.taxRegime).toBe('Simples Nacional');
  });

  it('should NOT allow USER to update an enterprise', async () => {
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
      .put(`/v1/hr/enterprises/${enterpriseId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        legalName: 'Updated Name',
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const fakeId = '550e8400-e29b-41d4-a716-446655440000';

    const response = await request(app.server)
      .put(`/v1/hr/enterprises/${fakeId}`)
      .send({
        legalName: 'Updated Name',
      });

    expect(response.statusCode).toBe(401);
  });

  it('should return 200 with null when enterprise is not found', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const fakeId = '550e8400-e29b-41d4-a716-446655440000';

    const response = await request(app.server)
      .put(`/v1/hr/enterprises/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: 'Updated Name',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.enterprise).toBeNull();
  });

  it('should update enterprise address', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const enterpriseData = generateEnterpriseData();

    const createResponse = await request(app.server)
      .post('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${token}`)
      .send(enterpriseData);

    const enterpriseId = createResponse.body.enterprise.id;

    const response = await request(app.server)
      .put(`/v1/hr/enterprises/${enterpriseId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        city: 'Rio de Janeiro',
        state: 'RJ',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.enterprise.city).toBe('Rio de Janeiro');
    expect(response.body.enterprise.state).toBe('RJ');
  });
});
