import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Compare Versions (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should compare two versions and return differences with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    const entityId = `compare-versions-${Date.now()}`;

    // Create 3 versions
    await prisma.auditLog.createMany({
      data: [
        {
          tenantId,
          action: 'CREATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          newData: { name: 'V1', price: 100.0, sku: 'SKU-001' },
          userId: user.user.id,
          createdAt: new Date('2025-01-01T10:00:00Z'),
        },
        {
          tenantId,
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'V1', price: 100.0, sku: 'SKU-001' },
          newData: { name: 'V2', price: 150.0, sku: 'SKU-002' },
          userId: user.user.id,
          createdAt: new Date('2025-01-02T10:00:00Z'),
        },
        {
          tenantId,
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'V2', price: 150.0, sku: 'SKU-002' },
          newData: { name: 'V3', price: 200.0, sku: 'SKU-003' },
          userId: user.user.id,
          createdAt: new Date('2025-01-03T10:00:00Z'),
        },
      ],
    });

    const response = await request(app.server)
      .get(`/v1/audit-logs/compare/PRODUCT/${entityId}?v1=1&v2=3`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('comparison');

    // Verify version1 structure
    expect(response.body.comparison.version1).toHaveProperty('version', 1);
    expect(response.body.comparison.version1).toHaveProperty('data');
    expect(response.body.comparison.version1.data).toEqual({
      name: 'V1',
      price: 100.0,
      sku: 'SKU-001',
    });

    // Verify version2 structure
    expect(response.body.comparison.version2).toHaveProperty('version', 3);
    expect(response.body.comparison.version2).toHaveProperty('data');
    expect(response.body.comparison.version2.data).toEqual({
      name: 'V3',
      price: 200.0,
      sku: 'SKU-003',
    });

    // Verify differences structure
    expect(response.body.comparison).toHaveProperty('differences');
    expect(response.body.comparison.differences).toBeInstanceOf(Array);
    expect(response.body.comparison).toHaveProperty('totalDifferences');
    expect(response.body.comparison.totalDifferences).toBe(3);

    // Cleanup
    await prisma.auditLog.deleteMany({ where: { entityId } });
  });
});
