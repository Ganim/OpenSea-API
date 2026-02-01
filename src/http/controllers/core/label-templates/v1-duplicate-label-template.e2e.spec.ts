import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createOrganizationE2E } from '@/utils/tests/factories/core/create-organization.e2e';

describe('Duplicate Label Template (E2E)', () => {
  let organizationId: string;

  beforeAll(async () => {
    await app.ready();
    const { organizationId: orgId } = await createOrganizationE2E();
    organizationId = orgId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should duplicate label template with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { organizationId });
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/label-templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Original Label Template ${timestamp}`,
        description: 'Template to duplicate',
        width: 100,
        height: 50,
        grapesJsData: JSON.stringify({ components: [], styles: [] }),
      });

    const templateId = createResponse.body.template.id;

    const response = await request(app.server)
      .post(`/v1/label-templates/${templateId}/duplicate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Duplicated Label Template ${timestamp}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('template');
    expect(response.body.template).toHaveProperty('id');
    expect(response.body.template.id).not.toBe(templateId);
    expect(response.body.template).toHaveProperty(
      'name',
      `Duplicated Label Template ${timestamp}`,
    );
    expect(response.body.template).toHaveProperty('width', 100);
    expect(response.body.template).toHaveProperty('height', 50);
  });
});
