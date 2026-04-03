import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Folder Templates (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return the list of available folder templates', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/storage/folder-templates')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('templates');
    expect(Array.isArray(response.body.templates)).toBe(true);
    expect(response.body.templates.length).toBeGreaterThanOrEqual(1);

    const firstTemplate = response.body.templates[0];
    expect(firstTemplate).toHaveProperty('id');
    expect(firstTemplate).toHaveProperty('name');
    expect(firstTemplate).toHaveProperty('description');
    expect(firstTemplate).toHaveProperty('folders');
    expect(Array.isArray(firstTemplate.folders)).toBe(true);

    if (firstTemplate.folders.length > 0) {
      const firstSubfolder = firstTemplate.folders[0];
      expect(firstSubfolder).toHaveProperty('name');
      expect(firstSubfolder).toHaveProperty('icon');
    }
  });

  it('should include known template ids', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/storage/folder-templates')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    const templateIds = response.body.templates.map(
      (template: { id: string }) => template.id,
    );
    expect(templateIds).toContain('employee-documents');
    expect(templateIds).toContain('project');
    expect(templateIds).toContain('department');
    expect(templateIds).toContain('company');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/storage/folder-templates',
    );

    expect(response.status).toBe(401);
  });
});
