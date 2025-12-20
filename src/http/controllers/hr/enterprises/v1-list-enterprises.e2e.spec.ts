import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generateEnterpriseData } from '@/utils/tests/factories/hr/create-enterprise.e2e';

describe('List Enterprises (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list enterprises with pagination', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    // Create some enterprises
    for (let i = 0; i < 3; i++) {
      await request(app.server)
        .post('/v1/hr/enterprises')
        .set('Authorization', `Bearer ${token}`)
        .send(generateEnterpriseData());
    }

    const response = await request(app.server)
      .get('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('enterprises');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('perPage');
    expect(Array.isArray(response.body.enterprises)).toBe(true);
  });

  it('should search enterprises by legal name', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const enterpriseName = `Tech Solutions ${Date.now()}`;

    await request(app.server)
      .post('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${token}`)
      .send(generateEnterpriseData({ legalName: enterpriseName }));

    const response = await request(app.server)
      .get('/v1/hr/enterprises')
      .query({ search: enterpriseName })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.enterprises.length).toBeGreaterThan(0);
    expect(response.body.enterprises[0].legalName).toContain(enterpriseName);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).get('/v1/hr/enterprises');

    expect(response.statusCode).toBe(401);
  });

  it('should allow pagination parameters', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .get('/v1/hr/enterprises')
      .query({ page: 1, perPage: 10 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.page).toBe(1);
    expect(response.body.perPage).toBe(10);
  });
});
