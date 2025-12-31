import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import {
  generateCNPJForTest,
  generateCompanyData,
} from '@/utils/tests/factories/hr/create-company.e2e';

describe('Create Company (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to create a new company', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const companyData = generateCompanyData();

    const response = await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send(companyData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      legalName: companyData.legalName,
      cnpj: companyData.cnpj,
    });
    expect(response.body.id).toBeDefined();
  });

  it('should allow ADMIN to create a new company', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const companyData = generateCompanyData();

    const response = await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send(companyData);

    expect(response.statusCode).toBe(201);
    expect(response.body.legalName).toBe(companyData.legalName);
  });

  it('should NOT allow user without permission to create a company', async () => {
    const { token } = await createAndAuthenticateUser(app, );
    const companyData = generateCompanyData();

    const response = await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send(companyData);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const companyData = generateCompanyData();

    const response = await request(app.server)
      .post('/v1/hr/companies')
      .send(companyData);

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when CNPJ is already registered', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const cnpj = generateCNPJForTest();

    const firstCompany = generateCompanyData({ cnpj });
    await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send(firstCompany);

    const secondCompany = generateCompanyData({ cnpj });

    const response = await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send(secondCompany);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('CNPJ already exists');
  });

  it('should return 400 when required fields are missing', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: 'Test Company',
        // Missing cnpj
      });

    expect(response.statusCode).toBe(400);
  });

  it('should create company with minimal data', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: 'Minimal Company',
        cnpj: generateCNPJForTest(),
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.legalName).toBe('Minimal Company');
  });
});
