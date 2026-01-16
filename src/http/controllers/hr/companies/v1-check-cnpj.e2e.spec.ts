import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import {
  generateCNPJForTest,
  generateCompanyData,
} from '@/utils/tests/factories/hr/create-company.e2e';

describe('Check CNPJ (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should check cnpj with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const cnpj = generateCNPJForTest();

    await request(app.server)
      .post('/v1/hr/companies')
      .set('Authorization', `Bearer ${token}`)
      .send(generateCompanyData({ cnpj }));

    const response = await request(app.server)
      .post('/v1/hr/companies/check-cnpj')
      .set('Authorization', `Bearer ${token}`)
      .send({ cnpj });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('exists');
  });
});
