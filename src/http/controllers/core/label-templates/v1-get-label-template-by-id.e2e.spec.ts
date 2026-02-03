import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createOrganizationE2E } from '@/utils/tests/factories/core/create-organization.e2e';

describe('Get Label Template By ID (E2E)', () => {
  let organizationId: string;

  beforeAll(async () => {
    await app.ready();
    const { organizationId: orgId } = await createOrganizationE2E();
    organizationId = orgId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get label template by id with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/label-templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Label Template ${timestamp}`,
        width: 100,
        height: 50,
        grapesJsData: JSON.stringify({ components: [], styles: [] }),
      });

    const templateId = createResponse.body.template.id;

    const response = await request(app.server)
      .get(`/v1/label-templates/${templateId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('template');
    expect(response.body.template).toHaveProperty('id', templateId);
    expect(response.body.template).toHaveProperty('name');
  });
});
