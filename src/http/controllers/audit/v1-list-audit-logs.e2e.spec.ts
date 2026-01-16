import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Audit Logs (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list audit logs with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const timestamp = Date.now();

    // Create test logs
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'CREATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId: `product-${timestamp}-1`,
          newData: { name: 'Product 1' },
          userId: user.user.id,
        },
        {
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId: `product-${timestamp}-1`,
          oldData: { name: 'Product 1' },
          newData: { name: 'Product 1 Updated' },
          userId: user.user.id,
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/audit-logs')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('logs');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.logs).toBeInstanceOf(Array);
    expect(response.body.logs.length).toBeGreaterThanOrEqual(2);

    // Verify log structure
    const log = response.body.logs[0];
    expect(log).toHaveProperty('id');
    expect(log).toHaveProperty('userId');
    expect(log).toHaveProperty('userName');
    expect(log).toHaveProperty('userPermissionGroups');
    expect(log).toHaveProperty('entity');
    expect(log).toHaveProperty('entityId');
    expect(log).toHaveProperty('action');

    // Verify pagination structure
    expect(response.body.pagination).toHaveProperty('total');
    expect(response.body.pagination).toHaveProperty('page');
    expect(response.body.pagination).toHaveProperty('limit');
    expect(response.body.pagination).toHaveProperty('totalPages');

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { entityId: { startsWith: `product-${timestamp}` } },
    });
  });
});
