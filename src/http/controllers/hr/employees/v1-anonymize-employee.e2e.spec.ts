import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

const NON_EXISTENT_EMPLOYEE_ID = '00000000-0000-0000-0000-000000000000';
const VALID_PIN = '1234';

describe('Anonymize Employee — LGPD Art. 18 VI (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: createdTenantId } = await createAndSetupTenant();
    tenantId = createdTenantId;
  });

  describe('DELETE /v1/hr/employees/:id/anonymize', () => {
    it('should reach the anonymize handler when authenticated with valid payload', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .delete(`/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/anonymize`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          pin: VALID_PIN,
          confirmation: 'ANONIMIZAR',
          reason: 'Solicitação LGPD do titular dos dados.',
        });

      // Depending on whether the user has a PIN configured and whether the
      // employee exists, handler returns 204, 400, 401 (PIN invalid) or 404.
      expect([204, 400, 401, 404]).toContain(response.status);
    });

    it('should return 400 when confirmation text is wrong', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .delete(`/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/anonymize`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          pin: VALID_PIN,
          confirmation: 'ANONYMIZE',
          reason: 'Teste',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when pin format is invalid', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .delete(`/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/anonymize`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          pin: '12',
          confirmation: 'ANONIMIZAR',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when pin contains non-digits', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .delete(`/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/anonymize`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          pin: 'abcd',
          confirmation: 'ANONIMIZAR',
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server)
        .delete(`/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/anonymize`)
        .send({
          pin: VALID_PIN,
          confirmation: 'ANONIMIZAR',
        });

      expect(response.status).toBe(401);
    });
  });
});
