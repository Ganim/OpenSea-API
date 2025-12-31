import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generateCompanyData } from '@/utils/tests/factories/hr/create-company.e2e';

describe('Delete Company (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to delete a company', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const companyData = generateCompanyData();

    const createResponse = await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send(companyData);

    const companyId = createResponse.body.id;

    const response = await request(app.server)
      .delete(`/v1/hr/companies/${companyId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });

  it('should NOT allow user without permission to delete a company', async () => {
    const { token: managerToken } = await createAndAuthenticateUser(
      app,
    );
    const { token: userToken } = await createAndAuthenticateUser(app, );

    const createResponse = await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(generateCompanyData());

    const companyId = createResponse.body.id;

    const response = await request(app.server)
      .delete(`/v1/hr/companies/${companyId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const fakeId = '550e8400-e29b-41d4-a716-446655440000';

    const response = await request(app.server).delete(
      `/v1/hr/companies/${fakeId}`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should soft delete company (not return it in queries)', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const companyData = generateCompanyData();

    const createResponse = await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send(companyData);

    const companyId = createResponse.body.id;

    // Delete the company
    await request(app.server)
      .delete(`/v1/hr/companies/${companyId}`)
      .set('Authorization', `Bearer ${token}`);

    // Try to get the deleted company
    const getResponse = await request(app.server)
      .get(`/v1/hr/companies/${companyId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.statusCode).toBe(404);
  });
});
