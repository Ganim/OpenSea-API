import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('V1DeleteCompanyStakeholder (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete a company stakeholder', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create a company first
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Delete Stakeholder',
      cnpj: '12345678000401',
    });

    // Create a stakeholder via API
    const createResponse = await request(app.server)
      .post(`/v1/hr/companies/${company.id}/stakeholders`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Stakeholder to Delete',
        role: 'SOCIO',
      });

    const stakeholderId = createResponse.body.id;

    const response = await request(app.server)
      .delete(`/v1/hr/companies/${company.id}/stakeholders/${stakeholderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toBe(204);
  });

  it('should return 404 when stakeholder not found', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create a company first
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Delete Stakeholder 2',
      cnpj: '12345678000402',
    });

    const response = await request(app.server)
      .delete(
        `/v1/hr/companies/${company.id}/stakeholders/550e8400-e29b-41d4-a716-446655440099`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .delete(
        '/v1/hr/companies/550e8400-e29b-41d4-a716-446655440000/stakeholders/550e8400-e29b-41d4-a716-446655440001',
      )
      .send({});

    expect(response.statusCode).toBe(401);
  });

  it('should NOT allow user without permission to delete stakeholder', async () => {
    const { token } = await createAndAuthenticateUser(app, );

    const response = await request(app.server)
      .delete(
        '/v1/hr/companies/550e8400-e29b-41d4-a716-446655440000/stakeholders/550e8400-e29b-41d4-a716-446655440001',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toBe(403);
  });
});
