import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Preview Rollback (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should preview rollback with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const entityId = `preview-rollback-${Date.now()}`;

    // Create an UPDATE log (can rollback)
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'PRODUCT',
        module: 'STOCK',
        entityId,
        oldData: { name: 'Old Name', price: 100.0 },
        newData: { name: 'New Name', price: 150.0 },
        userId: user.user.id,
      },
    });

    const response = await request(app.server)
      .get(`/v1/audit-logs/rollback/preview/PRODUCT/${entityId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('preview');

    // Verify preview structure
    expect(response.body.preview).toHaveProperty('canRollback', true);
    expect(response.body.preview).toHaveProperty('targetState');
    expect(response.body.preview).toHaveProperty('currentState');
    expect(response.body.preview).toHaveProperty('changes');

    expect(response.body.preview.targetState).toEqual({
      name: 'Old Name',
      price: 100.0,
    });
    expect(response.body.preview.currentState).toEqual({
      name: 'New Name',
      price: 150.0,
    });
    expect(response.body.preview.changes).toBeInstanceOf(Array);
    expect(response.body.preview.changes.length).toBe(2);

    // Cleanup
    await prisma.auditLog.deleteMany({ where: { entityId } });
  });
});
