import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Generate Label Template Thumbnail (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should generate label template thumbnail with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
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
      .post(`/v1/label-templates/${templateId}/generate-thumbnail`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('thumbnailUrl');
    expect(typeof response.body.thumbnailUrl).toBe('string');
  });
});
