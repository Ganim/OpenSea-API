import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generateCompanyData } from '@/utils/tests/factories/hr/create-company.e2e';

describe('Update Company (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to update a company', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const companyData = generateCompanyData();

    const createResponse = await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send(companyData);

    const companyId = createResponse.body.id;

    const response = await request(app.server)
      .patch(`/v1/hr/companies/${companyId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: 'Updated Company Name',
        taxRegime: 'SIMPLES',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.legalName).toBe('Updated Company Name');
    expect(response.body.taxRegime).toBe('SIMPLES');
  });

  it('should NOT allow user without permission to update a company', async () => {
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
      .patch(`/v1/hr/companies/${companyId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        legalName: 'Updated Name',
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const companyData = generateCompanyData();

    const createResponse = await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send(companyData);

    const companyId = createResponse.body.id;

    const response = await request(app.server)
      .patch(`/v1/hr/companies/${companyId}`)
      .send({
        legalName: 'Updated Name',
      });

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 when company is not found', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const fakeId = '550e8400-e29b-41d4-a716-446655440000';

    const response = await request(app.server)
      .patch(`/v1/hr/companies/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: 'Updated Name',
      });

    expect(response.statusCode).toBe(404);
  });
});
