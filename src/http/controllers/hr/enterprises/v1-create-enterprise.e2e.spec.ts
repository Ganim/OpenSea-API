import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import {
  generateCNPJForTest,
  generateEnterpriseData,
} from '@/utils/tests/factories/hr/create-enterprise.e2e';

describe('Create Enterprise (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to create a new enterprise', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const enterpriseData = generateEnterpriseData();

    const response = await request(app.server)
      .post('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${token}`)
      .send(enterpriseData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('enterprise');
    expect(response.body.enterprise).toMatchObject({
      legalName: enterpriseData.legalName,
      cnpj: enterpriseData.cnpj,
    });
    expect(response.body.enterprise.id).toBeDefined();
  });

  it('should allow ADMIN to create a new enterprise', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const enterpriseData = generateEnterpriseData();

    const response = await request(app.server)
      .post('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${token}`)
      .send(enterpriseData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('enterprise');
    expect(response.body.enterprise.legalName).toBe(enterpriseData.legalName);
  });

  it('should NOT allow USER to create an enterprise', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const enterpriseData = generateEnterpriseData();

    const response = await request(app.server)
      .post('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${token}`)
      .send(enterpriseData);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const enterpriseData = generateEnterpriseData();

    const response = await request(app.server)
      .post('/v1/hr/enterprises')
      .send(enterpriseData);

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when CNPJ is already registered', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const cnpj = generateCNPJForTest();

    const firstEnterprise = generateEnterpriseData({ cnpj });
    await request(app.server)
      .post('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${token}`)
      .send(firstEnterprise);

    const secondEnterprise = generateEnterpriseData({ cnpj });

    const response = await request(app.server)
      .post('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${token}`)
      .send(secondEnterprise);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('CNPJ already exists');
  });

  it('should return 400 when required fields are missing', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .post('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: 'Test Company',
        // Missing cnpj
      });

    expect(response.statusCode).toBe(400);
  });

  it('should create enterprise with minimal data', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .post('/v1/hr/enterprises')
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: 'Minimal Company',
        cnpj: generateCNPJForTest(),
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.enterprise).toHaveProperty('id');
    expect(response.body.enterprise.legalName).toBe('Minimal Company');
  });
});
