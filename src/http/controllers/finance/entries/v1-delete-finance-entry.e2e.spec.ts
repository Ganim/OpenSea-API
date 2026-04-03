import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  createFinancePrerequisites,
  createFinanceEntry,
} from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Delete Finance Entry (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should delete a finance entry', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const entry = await createFinanceEntry(tenantId, {
      categoryId: category.id,
      costCenterId: costCenter.id,
    });

    const response = await request(app.server)
      .delete(`/v1/finance/entries/${entry.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).delete(
      '/v1/finance/entries/any-id',
    );
    expect(response.status).toBe(401);
  });

  it('should return 404 when deleting a non-existent entry', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const fakeId = randomUUID();
    const response = await request(app.server)
      .delete(`/v1/finance/entries/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 when deleting a PAID entry', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const entry = await createFinanceEntry(
      tenantId,
      { categoryId: category.id, costCenterId: costCenter.id },
      { status: 'PAID' },
    );

    const response = await request(app.server)
      .delete(`/v1/finance/entries/${entry.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('PAID');
  });

  it('should return 400 when deleting a RECEIVED entry', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const entry = await createFinanceEntry(
      tenantId,
      { categoryId: category.id, costCenterId: costCenter.id },
      { type: 'RECEIVABLE', status: 'RECEIVED' },
    );

    const response = await request(app.server)
      .delete(`/v1/finance/entries/${entry.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('RECEIVED');
  });

  it('should allow deleting a CANCELLED entry', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const entry = await createFinanceEntry(
      tenantId,
      { categoryId: category.id, costCenterId: costCenter.id },
      { status: 'CANCELLED' },
    );

    const response = await request(app.server)
      .delete(`/v1/finance/entries/${entry.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should return 400 for invalid UUID in params', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .delete('/v1/finance/entries/not-a-uuid')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});
