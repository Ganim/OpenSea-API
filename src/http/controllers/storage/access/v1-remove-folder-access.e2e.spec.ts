import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Remove Folder Access (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should remove an access rule', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;
    const { folderId } = await createStorageFolderE2E({ tenantId });

    // First create a rule
    const setResponse = await request(app.server)
      .post(`/v1/storage/folders/${folderId}/access`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        canRead: true,
        canWrite: false,
        canDelete: false,
        canShare: false,
      });

    const ruleId = setResponse.body.rule.id;

    // Then remove it
    const response = await request(app.server)
      .delete(`/v1/storage/folders/${folderId}/access/${ruleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 for non-existent rule', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { folderId } = await createStorageFolderE2E({ tenantId });

    const response = await request(app.server)
      .delete(
        `/v1/storage/folders/${folderId}/access/00000000-0000-0000-0000-000000000000`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return error without auth', async () => {
    const response = await request(app.server).delete(
      '/v1/storage/folders/00000000-0000-0000-0000-000000000000/access/00000000-0000-0000-0000-000000000001',
    );

    expect([400, 401]).toContain(response.status);
  });
});
