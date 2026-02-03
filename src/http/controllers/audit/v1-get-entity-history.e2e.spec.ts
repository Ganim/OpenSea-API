import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Entity History (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return entity history with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    const entityId = `entity-history-${Date.now()}`;

    // Create complete history (CREATE -> UPDATE -> UPDATE)
    await prisma.auditLog.createMany({
      data: [
        {
          tenantId,
          action: 'CREATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          newData: { name: 'V1', price: 100 },
          userId: user.user.id,
          createdAt: new Date('2025-01-01T10:00:00Z'),
        },
        {
          tenantId,
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'V1', price: 100 },
          newData: { name: 'V2', price: 150 },
          userId: user.user.id,
          createdAt: new Date('2025-01-02T10:00:00Z'),
        },
        {
          tenantId,
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'V2', price: 150 },
          newData: { name: 'V3', price: 200 },
          userId: user.user.id,
          createdAt: new Date('2025-01-03T10:00:00Z'),
        },
      ],
    });

    const response = await request(app.server)
      .get(`/v1/audit-logs/history/PRODUCT/${entityId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('history');
    expect(response.body.history).toBeInstanceOf(Array);
    expect(response.body.history.length).toBe(3);

    // Verify chronological order (oldest first)
    expect(response.body.history[0].version).toBe(1);
    expect(response.body.history[0].action).toBe('CREATE');
    expect(response.body.history[1].version).toBe(2);
    expect(response.body.history[1].action).toBe('UPDATE');
    expect(response.body.history[2].version).toBe(3);
    expect(response.body.history[2].action).toBe('UPDATE');

    // Verify that UPDATEs include changes
    expect(response.body.history[1]).toHaveProperty('changes');
    expect(response.body.history[2]).toHaveProperty('changes');

    // Cleanup
    await prisma.auditLog.deleteMany({ where: { entityId } });
  });
});
