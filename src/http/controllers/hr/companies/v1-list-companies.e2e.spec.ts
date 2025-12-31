import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generateCompanyData } from '@/utils/tests/factories/hr/create-company.e2e';

describe('List Companies (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list companies with pagination', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create some companies
    for (let i = 0; i < 3; i++) {
      await request(app.server)
        .post('/v1/hr/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(generateCompanyData());
    }

    const response = await request(app.server)
      .get('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should search companies by legal name', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const companyName = `Tech Solutions ${Date.now()}`;

    await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send(generateCompanyData({ legalName: companyName }));

    const response = await request(app.server)
      .get('/v1/hr/companies')
      .query({ search: companyName })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].legalName).toContain(companyName);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).get('/v1/hr/companies');

    expect(response.statusCode).toBe(401);
  });

  it('should allow pagination parameters', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/hr/companies')
      .query({ page: 1, perPage: 10 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
