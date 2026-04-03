import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Apply Campaign (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });


  it('should return error for non-existent insight', async () => {
    const fakeInsightId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post(`/v1/ai/campaigns/${fakeInsightId}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect([400, 404, 500]).toContain(response.status);
  });

  it('should return 401 without token', async () => {
    const fakeInsightId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post(`/v1/ai/campaigns/${fakeInsightId}/apply`)
      .send();

    expect(response.status).toBe(401);
  });
});
