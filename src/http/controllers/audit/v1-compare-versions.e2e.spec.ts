import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Compare Versions (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should compare two versions successfully', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'ADMIN');

    const entityId = 'compare-versions-test-1';

    // Criar 3 versões
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'CREATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          newData: { name: 'V1', price: 100.0, sku: 'SKU-001' },
          userId: user.id,
          createdAt: new Date('2025-01-01T10:00:00Z'),
        },
        {
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'V1', price: 100.0, sku: 'SKU-001' },
          newData: { name: 'V2', price: 150.0, sku: 'SKU-002' },
          userId: user.id,
          createdAt: new Date('2025-01-02T10:00:00Z'),
        },
        {
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'V2', price: 150.0, sku: 'SKU-002' },
          newData: { name: 'V3', price: 200.0, sku: 'SKU-003' },
          userId: user.id,
          createdAt: new Date('2025-01-03T10:00:00Z'),
        },
      ],
    });

    const response = await request(app.server)
      .get(`/v1/audit-logs/compare/PRODUCT/${entityId}?v1=1&v2=3`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.comparison).toBeDefined();

    // Verificar version1
    expect(response.body.comparison.version1.version).toBe(1);
    expect(response.body.comparison.version1.data).toEqual({
      name: 'V1',
      price: 100.0,
      sku: 'SKU-001',
    });

    // Verificar version2
    expect(response.body.comparison.version2.version).toBe(3);
    expect(response.body.comparison.version2.data).toEqual({
      name: 'V3',
      price: 200.0,
      sku: 'SKU-003',
    });

    // Verificar diferenças
    expect(response.body.comparison.differences).toHaveLength(3);
    expect(response.body.comparison.totalDifferences).toBe(3);

    const nameDiff = response.body.comparison.differences.find(
      (d: any) => d.field === 'name',
    );
    expect(nameDiff).toEqual({
      field: 'name',
      version1Value: 'V1',
      version2Value: 'V3',
    });

    const priceDiff = response.body.comparison.differences.find(
      (d: any) => d.field === 'price',
    );
    expect(priceDiff).toEqual({
      field: 'price',
      version1Value: 100.0,
      version2Value: 200.0,
    });

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { entityId },
    });
  });

  it('should return no differences for identical versions', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'ADMIN');

    const entityId = 'compare-identical-versions';

    // Criar 2 versões idênticas
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'CREATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          newData: { name: 'Product', price: 100.0 },
          userId: user.id,
          createdAt: new Date('2025-01-01T10:00:00Z'),
        },
        {
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'Product', price: 100.0 },
          newData: { name: 'Product', price: 100.0 },
          userId: user.id,
          createdAt: new Date('2025-01-02T10:00:00Z'),
        },
      ],
    });

    const response = await request(app.server)
      .get(`/v1/audit-logs/compare/PRODUCT/${entityId}?v1=1&v2=2`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.comparison.differences).toEqual([]);
    expect(response.body.comparison.totalDifferences).toBe(0);

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { entityId },
    });
  });

  it('should handle partial changes', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'ADMIN');

    const entityId = 'compare-partial-changes';

    // Criar versões onde apenas 1 campo mudou
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'CREATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          newData: { name: 'Product', price: 100.0, sku: 'SKU-001', stock: 10 },
          userId: user.id,
          createdAt: new Date('2025-01-01T10:00:00Z'),
        },
        {
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'Product', price: 100.0, sku: 'SKU-001', stock: 10 },
          newData: {
            name: 'Product',
            price: 150.0,
            sku: 'SKU-001',
            stock: 10,
          },
          userId: user.id,
          createdAt: new Date('2025-01-02T10:00:00Z'),
        },
      ],
    });

    const response = await request(app.server)
      .get(`/v1/audit-logs/compare/PRODUCT/${entityId}?v1=1&v2=2`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.comparison.differences).toHaveLength(1);
    expect(response.body.comparison.differences[0]).toEqual({
      field: 'price',
      version1Value: 100.0,
      version2Value: 150.0,
    });

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { entityId },
    });
  });

  it('should return error for missing version parameters', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');

    const response = await request(app.server)
      .get('/v1/audit-logs/compare/PRODUCT/test-id')
      .set('Authorization', `Bearer ${token}`);

    // Zod validation error - missing query params
    expect(response.statusCode).toBe(400);
  });

  it('should return error for invalid version numbers', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');

    const response = await request(app.server)
      .get('/v1/audit-logs/compare/PRODUCT/test-id?v1=abc&v2=def')
      .set('Authorization', `Bearer ${token}`);

    // Zod coercion should fail
    expect(response.statusCode).toBe(400);
  });

  it('should return error for version out of bounds', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'ADMIN');

    const entityId = 'compare-out-of-bounds';

    // Criar apenas 2 versões
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'CREATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          newData: { name: 'V1' },
          userId: user.id,
          createdAt: new Date('2025-01-01T10:00:00Z'),
        },
        {
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'V1' },
          newData: { name: 'V2' },
          userId: user.id,
          createdAt: new Date('2025-01-02T10:00:00Z'),
        },
      ],
    });

    // Tentar acessar versão 999 que não existe
    const response = await request(app.server)
      .get(`/v1/audit-logs/compare/PRODUCT/${entityId}?v1=1&v2=999`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('does not exist');

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { entityId },
    });
  });

  it('should return error for version 0 or negative', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'ADMIN');

    const entityId = 'compare-zero-version';

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'PRODUCT',
        module: 'STOCK',
        entityId,
        newData: { name: 'V1' },
        userId: user.id,
      },
    });

    const response = await request(app.server)
      .get(`/v1/audit-logs/compare/PRODUCT/${entityId}?v1=0&v2=1`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('positive integers');

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { entityId },
    });
  });

  it('should compare non-consecutive versions', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'ADMIN');

    const entityId = 'compare-non-consecutive';

    // Criar 5 versões
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'CREATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          newData: { name: 'V1', price: 100.0 },
          userId: user.id,
          createdAt: new Date('2025-01-01T10:00:00Z'),
        },
        {
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'V1', price: 100.0 },
          newData: { name: 'V2', price: 120.0 },
          userId: user.id,
          createdAt: new Date('2025-01-02T10:00:00Z'),
        },
        {
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'V2', price: 120.0 },
          newData: { name: 'V3', price: 140.0 },
          userId: user.id,
          createdAt: new Date('2025-01-03T10:00:00Z'),
        },
        {
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'V3', price: 140.0 },
          newData: { name: 'V4', price: 160.0 },
          userId: user.id,
          createdAt: new Date('2025-01-04T10:00:00Z'),
        },
        {
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'V4', price: 160.0 },
          newData: { name: 'V5', price: 180.0 },
          userId: user.id,
          createdAt: new Date('2025-01-05T10:00:00Z'),
        },
      ],
    });

    // Comparar V1 com V5 (pulando V2, V3, V4)
    const response = await request(app.server)
      .get(`/v1/audit-logs/compare/PRODUCT/${entityId}?v1=1&v2=5`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.comparison.version1.data.name).toBe('V1');
    expect(response.body.comparison.version1.data.price).toBe(100.0);
    expect(response.body.comparison.version2.data.name).toBe('V5');
    expect(response.body.comparison.version2.data.price).toBe(180.0);
    expect(response.body.comparison.totalDifferences).toBe(2);

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { entityId },
    });
  });

  it('should handle comparison in reverse order (v1=2, v2=1)', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'ADMIN');

    const entityId = 'compare-reverse-order';

    await prisma.auditLog.createMany({
      data: [
        {
          action: 'CREATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          newData: { name: 'V1', price: 100.0 },
          userId: user.id,
          createdAt: new Date('2025-01-01T10:00:00Z'),
        },
        {
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'V1', price: 100.0 },
          newData: { name: 'V2', price: 150.0 },
          userId: user.id,
          createdAt: new Date('2025-01-02T10:00:00Z'),
        },
      ],
    });

    // Comparar em ordem reversa
    const response = await request(app.server)
      .get(`/v1/audit-logs/compare/PRODUCT/${entityId}?v1=2&v2=1`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    // v1 deve ser V2 e v2 deve ser V1
    expect(response.body.comparison.version1.version).toBe(2);
    expect(response.body.comparison.version1.data.name).toBe('V2');
    expect(response.body.comparison.version2.version).toBe(1);
    expect(response.body.comparison.version2.data.name).toBe('V1');

    // As diferenças devem estar invertidas
    const priceDiff = response.body.comparison.differences.find(
      (d: any) => d.field === 'price',
    );
    expect(priceDiff.version1Value).toBe(150.0);
    expect(priceDiff.version2Value).toBe(100.0);

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { entityId },
    });
  });

  it('should return 404 for entity with no logs', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');

    const response = await request(app.server)
      .get('/v1/audit-logs/compare/PRODUCT/non-existent-id?v1=1&v2=2')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toContain('No audit logs found');
  });

  it('should validate entity type', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');

    const response = await request(app.server)
      .get('/v1/audit-logs/compare/INVALID_ENTITY/test-id?v1=1&v2=2')
      .set('Authorization', `Bearer ${token}`);

    // Zod validation error
    expect(response.statusCode).toBe(400);
  });

  it('should require authentication', async () => {
    const response = await request(app.server).get(
      '/v1/audit-logs/compare/PRODUCT/test-id?v1=1&v2=2',
    );

    expect(response.statusCode).toBe(401);
  });
});
