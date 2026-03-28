import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTerminationE2E } from '@/utils/tests/factories/hr/create-termination.e2e';

describe('Generate TRCT PDF (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should generate TRCT PDF for a termination', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { terminationId } = await createTerminationE2E({
      tenantId,
      status: 'CALCULATED',
    });

    const response = await request(app.server)
      .get(`/v1/hr/terminations/${terminationId}/trct`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.body).toBeDefined();
  });

  it('should return 404 for non-existent termination', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/hr/terminations/00000000-0000-0000-0000-000000000000/trct')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});
