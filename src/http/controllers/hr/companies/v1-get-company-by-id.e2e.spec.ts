import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generateCompanyData } from '@/utils/tests/factories/hr/create-company.e2e';

describe('Get Company By ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get a company by ID', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const companyData = generateCompanyData();

    const createResponse = await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send(companyData);

    const companyId = createResponse.body.id;

    const response = await request(app.server)
      .get(`/v1/hr/companies/${companyId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.id).toBe(companyId);
    expect(response.body.legalName).toBe(companyData.legalName);
  });

  it('should return 404 when company is not found', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const fakeId = '550e8400-e29b-41d4-a716-446655440000';

    const response = await request(app.server)
      .get(`/v1/hr/companies/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const fakeId = '550e8400-e29b-41d4-a716-446655440000';

    const response = await request(app.server).get(
      `/v1/hr/companies/${fakeId}`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when ID format is invalid', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/hr/companies/invalid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
  });
});
