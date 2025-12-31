import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('V1CreateCompanyStakeholder (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a company stakeholder', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create a company first
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Stakeholder',
      cnpj: '12345678000101',
    });

    const response = await request(app.server)
      .post(`/v1/hr/companies/${company.id}/stakeholders`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'João da Silva',
        role: 'SOCIO',
        entryDate: new Date('2020-01-01').toISOString(),
        isLegalRepresentative: true,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe('João da Silva');
    expect(response.body.role).toBe('SOCIO');
  });

  it('should return 400 when required fields are missing', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create a company first
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Stakeholder 2',
      cnpj: '12345678000102',
    });

    const response = await request(app.server)
      .post(`/v1/hr/companies/${company.id}/stakeholders`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toBe(400);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/hr/companies/550e8400-e29b-41d4-a716-446655440000/stakeholders')
      .send({
        name: 'João da Silva',
      });

    expect(response.statusCode).toBe(401);
  });

  it('should NOT allow user without permission to create stakeholder', async () => {
    const { token } = await createAndAuthenticateUser(app, );

    const response = await request(app.server)
      .post('/v1/hr/companies/550e8400-e29b-41d4-a716-446655440000/stakeholders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'João da Silva',
        role: 'SOCIO',
      });

    expect(response.statusCode).toBe(403);
  });

  it('should compute pending issues for incomplete data', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create a company first
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Stakeholder 3',
      cnpj: '12345678000103',
    });

    const response = await request(app.server)
      .post(`/v1/hr/companies/${company.id}/stakeholders`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'João da Silva',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.pendingIssues).toBeDefined();
    expect(Array.isArray(response.body.pendingIssues)).toBe(true);
  });
});
