import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTerminationE2E } from '@/utils/tests/factories/hr/create-termination.e2e';

describe('Calculate Termination (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should calculate termination payment', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { terminationId } = await createTerminationE2E({ tenantId });

    const response = await request(app.server)
      .post(`/v1/hr/terminations/${terminationId}/calculate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        totalFgtsBalance: 5000,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('termination');
    expect(response.body).toHaveProperty('breakdown');
    expect(response.body.breakdown).toHaveProperty('saldoSalario');
    expect(response.body.breakdown).toHaveProperty('decimoTerceiroProp');
    expect(response.body.breakdown).toHaveProperty('feriasProporcional');
    expect(response.body.breakdown).toHaveProperty('totalBruto');
    expect(response.body.breakdown).toHaveProperty('totalDescontos');
    expect(response.body.breakdown).toHaveProperty('totalLiquido');
    expect(response.body.termination.status).toBe('CALCULATED');
  });

  it('should return 404 for non-existent termination', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(
        '/v1/hr/terminations/00000000-0000-0000-0000-000000000000/calculate',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        totalFgtsBalance: 0,
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});
