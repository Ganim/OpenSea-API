import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generateCompanyData } from '@/utils/tests/factories/hr/create-company.e2e';

describe('Delete Company (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete company with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const companyData = generateCompanyData();

    const createResponse = await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send(companyData);

    const companyId = createResponse.body.id;

    const response = await request(app.server)
      .delete(`/v1/hr/companies/${companyId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
