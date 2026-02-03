import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { generatePositionData } from '@/utils/tests/factories/hr/create-position.e2e';

describe('Create Position (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create position with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const positionData = generatePositionData();

    const response = await request(app.server)
      .post('/v1/hr/positions')
      .set('Authorization', `Bearer ${token}`)
      .send(positionData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('position');
    expect(response.body.position).toHaveProperty('id');
    expect(response.body.position.name).toBe(positionData.name);
    expect(response.body.position.code).toBe(positionData.code);
  });
});
