import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generateCIDCode } from '@/utils/tests/factories/hr/create-absence.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Request Sick Leave (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to request sick leave', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E({ status: 'ACTIVE' });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000); // 3 dias

    const response = await request(app.server)
      .post('/v1/hr/absences/sick-leave')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        cid: generateCIDCode(),
        reason: 'Atestado médico por consulta',
        documentUrl: 'https://example.com/atestado.pdf',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.absence).toBeDefined();
    expect(response.body.absence.type).toBe('SICK_LEAVE');
    expect(response.body.absence.status).toBe('PENDING');
    expect(response.body.absence.employeeId).toBe(employeeId);
    expect(response.body.absence.cid).toBeDefined();
  });

  it('should not request sick leave without CID code', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E({ status: 'ACTIVE' });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);

    const response = await request(app.server)
      .post('/v1/hr/absences/sick-leave')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: 'Atestado médico',
      });

    expect(response.statusCode).toBe(400);
  });

  it('should set isInssResponsibility for sick leave > 15 days', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E({ status: 'ACTIVE' });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 19 * 24 * 60 * 60 * 1000); // 20 dias

    const response = await request(app.server)
      .post('/v1/hr/absences/sick-leave')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        cid: generateCIDCode(),
        reason: 'Atestado médico prolongado',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.absence.totalDays).toBeGreaterThan(15);
  });

  it('should not request sick leave for inactive employee', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E({ status: 'TERMINATED' });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);

    const response = await request(app.server)
      .post('/v1/hr/absences/sick-leave')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        cid: generateCIDCode(),
        reason: 'Atestado médico',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should return 401 when no token is provided', async () => {
    // Cria dados reais no banco para que a validação passe
    const { employeeId } = await createEmployeeE2E({ status: 'ACTIVE' });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);

    const response = await request(app.server)
      .post('/v1/hr/absences/sick-leave')
      .send({
        employeeId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        cid: generateCIDCode(),
        reason: 'Test reason for sick leave request',
      });

    expect(response.statusCode).toBe(401);
  });
});
