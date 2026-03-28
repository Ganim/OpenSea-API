import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Create Termination (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a termination record', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });

    const terminationDate = new Date().toISOString();
    const lastWorkDay = new Date().toISOString();

    const response = await request(app.server)
      .post('/v1/hr/terminations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId: employee.id,
        type: 'SEM_JUSTA_CAUSA',
        terminationDate,
        lastWorkDay,
        noticeType: 'INDENIZADO',
        notes: 'Termination for E2E test',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('termination');
    expect(response.body.termination).toHaveProperty('id');
    expect(response.body.termination.employeeId).toBe(employee.id);
    expect(response.body.termination.type).toBe('SEM_JUSTA_CAUSA');
    expect(response.body.termination.noticeType).toBe('INDENIZADO');
    expect(response.body.termination.status).toBe('PENDING');
  });

  it('should return 404 for non-existent employee', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/terminations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId: '00000000-0000-0000-0000-000000000000',
        type: 'SEM_JUSTA_CAUSA',
        terminationDate: new Date().toISOString(),
        lastWorkDay: new Date().toISOString(),
        noticeType: 'INDENIZADO',
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});
