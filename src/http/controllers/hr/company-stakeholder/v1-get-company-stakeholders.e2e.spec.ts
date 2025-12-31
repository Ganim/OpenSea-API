import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('V1GetCompanyStakeholders (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get all stakeholders for a company', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create a company first
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Get Stakeholders',
      cnpj: '99876543000301',
    });

    // Create stakeholders via API (to persist in database)
    await request(app.server)
      .post(`/v1/hr/companies/${company.id}/stakeholders`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Stakeholder 1',
        role: 'SOCIO',
      });

    await request(app.server)
      .post(`/v1/hr/companies/${company.id}/stakeholders`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Stakeholder 2',
        role: 'ADMINISTRADOR',
      });

    const response = await request(app.server)
      .get(`/v1/hr/companies/${company.id}/stakeholders`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
  });

  it('should return empty array when company has no stakeholders', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create a company without stakeholders
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company No Stakeholders',
      cnpj: '99876543000302',
    });

    const response = await request(app.server)
      .get(`/v1/hr/companies/${company.id}/stakeholders`)
      .set('Authorization', `Bearer ${token}`);

    expect([200, 404]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      expect(response.body).toEqual([]);
    }
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get(
      '/v1/hr/companies/550e8400-e29b-41d4-a716-446655440000/stakeholders',
    );

    expect(response.statusCode).toBe(401);
  });
});
