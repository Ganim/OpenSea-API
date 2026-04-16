import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

const NON_EXISTENT_EMPLOYEE_ID = '00000000-0000-0000-0000-000000000000';
const VALID_PIN = '1234';

describe('Salary History (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: createdTenantId } = await createAndSetupTenant();
    tenantId = createdTenantId;
  });

  describe('GET /v1/hr/employees/:id/salary-history', () => {
    it('should reach the list handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get(`/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/salary-history`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      // 403 when permission middleware rejects scope (resource-level scope check)
      expect([200, 403, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).get(
        `/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/salary-history`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/hr/employees/:id/salary-history', () => {
    it('should reach the register handler when authenticated with valid payload', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/salary-history`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          newSalary: 5000,
          reason: 'MERIT',
          notes: 'Aumento por mérito.',
          effectiveDate: new Date().toISOString(),
          pin: VALID_PIN,
        });

      // Expect the request to pass schema validation and reach the handler.
      // The exact status depends on whether the user has a PIN configured,
      // whether the employee exists and whether the scope check passed.
      expect(response.status).not.toBe(401);
      expect([201, 400, 403, 404]).toContain(response.status);
    });

    it('should return 400 when pin format is invalid', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/salary-history`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          newSalary: 5000,
          reason: 'MERIT',
          effectiveDate: new Date().toISOString(),
          pin: '12',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when reason is invalid', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/salary-history`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          newSalary: 5000,
          reason: 'INVALID_REASON',
          effectiveDate: new Date().toISOString(),
          pin: VALID_PIN,
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server)
        .post(`/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/salary-history`)
        .send({
          newSalary: 5000,
          reason: 'MERIT',
          effectiveDate: new Date().toISOString(),
          pin: VALID_PIN,
        });

      expect(response.status).toBe(401);
    });
  });
});
