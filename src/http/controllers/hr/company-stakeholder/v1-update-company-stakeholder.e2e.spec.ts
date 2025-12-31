import { app } from '@/app';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('V1UpdateCompanyStakeholder (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a company stakeholder', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create a company first
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Update Stakeholder',
      cnpj: '12345678000301',
    });

    // Create a stakeholder via API
    const createResponse = await request(app.server)
      .post(`/v1/hr/companies/${company.id}/stakeholders`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Original Name',
        role: 'SOCIO',
      });

    const stakeholderId = createResponse.body.id;

    const response = await request(app.server)
      .patch(`/v1/hr/companies/${company.id}/stakeholders/${stakeholderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'João Silva Updated',
        role: 'ADMINISTRADOR',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('João Silva Updated');
    expect(response.body.role).toBe('ADMINISTRADOR');
  });

  it('should return 404 when stakeholder not found', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create a company first
    const createCompanyUseCase = makeCreateCompanyUseCase();
    const { company } = await createCompanyUseCase.execute({
      legalName: 'Test Company Update Stakeholder 2',
      cnpj: '12345678000302',
    });

    const response = await request(app.server)
      .patch(
        `/v1/hr/companies/${company.id}/stakeholders/550e8400-e29b-41d4-a716-446655440099`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
      });

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .patch(
        '/v1/hr/companies/550e8400-e29b-41d4-a716-446655440000/stakeholders/550e8400-e29b-41d4-a716-446655440001',
      )
      .send({
        name: 'Updated Name',
      });

    expect(response.statusCode).toBe(401);
  });

  it('should NOT allow user without permission to update stakeholder', async () => {
    const { token } = await createAndAuthenticateUser(app, );

    const response = await request(app.server)
      .patch(
        '/v1/hr/companies/550e8400-e29b-41d4-a716-446655440000/stakeholders/550e8400-e29b-41d4-a716-446655440001',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
      });

    expect(response.statusCode).toBe(403);
  });
});
