import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import {
  generateCNPJForTest,
  generateEnterpriseData,
} from '@/utils/tests/factories/hr/create-enterprise.e2e';

describe('Check CNPJ (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should check if CNPJ exists', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const cnpj = generateCNPJForTest();

    // First, create an enterprise
    await request(app.server)
      .post('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${token}`)
      .send(generateEnterpriseData({ cnpj }));

    // Then check if it exists
    const response = await request(app.server)
      .post('/v1/hr/enterprises/check-cnpj')
      .set('Authorization', `Bearer ${token}`)
      .send({ cnpj });

    expect(response.statusCode).toBe(200);
    expect(response.body.exists).toBe(true);
    expect(response.body.enterpriseId).toBeDefined();
  });

  it('should return false for non-existent CNPJ', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const cnpj = generateCNPJForTest();

    const response = await request(app.server)
      .post('/v1/hr/enterprises/check-cnpj')
      .set('Authorization', `Bearer ${token}`)
      .send({ cnpj });

    expect(response.statusCode).toBe(200);
    expect(response.body.exists).toBe(false);
    expect(response.body.enterpriseId).toBeUndefined();
  });

  it('should return 401 when no token is provided', async () => {
    const cnpj = generateCNPJForTest();

    const response = await request(app.server)
      .post('/v1/hr/enterprises/check-cnpj')
      .send({ cnpj });

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when CNPJ format is invalid', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .post('/v1/hr/enterprises/check-cnpj')
      .set('Authorization', `Bearer ${token}`)
      .send({ cnpj: 'invalid-cnpj' });

    expect(response.statusCode).toBe(400);
  });
});
