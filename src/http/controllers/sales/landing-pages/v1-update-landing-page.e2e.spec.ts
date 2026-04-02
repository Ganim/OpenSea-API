import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Landing Page (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a landing page', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/sales/landing-pages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Update Page ${timestamp}`,
        slug: `update-page-${timestamp}`,
        template: 'lead-capture',
        content: {},
      });

    const landingPageId = createResponse.body.landingPage.id;

    const response = await request(app.server)
      .put(`/v1/sales/landing-pages/${landingPageId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: `Updated Page ${timestamp}` });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('landingPage');
    expect(response.body.landingPage.title).toBe(`Updated Page ${timestamp}`);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .put('/v1/sales/landing-pages/00000000-0000-0000-0000-000000000000')
      .send({ title: 'No Auth' });

    expect(response.status).toBe(401);
  });
});
