import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Audit Logs (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list audit logs with authentication', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'ADMIN');

    // Criar alguns logs de teste
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'CREATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId: 'product-1',
          newData: { name: 'Product 1' },
          userId: user.id,
        },
        {
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId: 'product-1',
          oldData: { name: 'Product 1' },
          newData: { name: 'Product 1 Updated' },
          userId: user.id,
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/audit-logs')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.logs).toBeInstanceOf(Array);
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);

    if (response.body.logs.length > 0) {
      const [firstLog] = response.body.logs;
      expect(firstLog.userName).toBeDefined();
      expect(firstLog.userPermissionGroups).toBeInstanceOf(Array);
    }

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { userId: user.id },
    });
  });

  it('should filter logs by userId', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'ADMIN');

    // Criar log específico para o usuário
    const log = await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'USER',
        module: 'CORE',
        entityId: user.user.id,
        newData: { email: user.user.email },
        userId: user.user.id,
      },
    });

    const response = await request(app.server)
      .get(`/v1/audit-logs?userId=${user.user.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.logs).toBeInstanceOf(Array);

    if (response.body.logs.length > 0) {
      response.body.logs.forEach((logItem: any) => {
        expect(logItem.userId).toBe(user.user.id);
        expect(logItem.userName).toBeDefined();
        expect(logItem.userPermissionGroups).toBeInstanceOf(Array);
      });
    }

    // Cleanup
    await prisma.auditLog.delete({ where: { id: log.id } });
  });

  it('should filter logs by entity and entityId', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'ADMIN');

    const entityId = 'test-product-123';

    // Criar logs para a mesma entidade
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'CREATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          newData: { name: 'Test Product' },
          userId: user.id,
        },
        {
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'Test Product' },
          newData: { name: 'Updated Product' },
          userId: user.id,
        },
      ],
    });

    const response = await request(app.server)
      .get(`/v1/audit-logs?entity=PRODUCT&entityId=${entityId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.logs.length).toBeGreaterThanOrEqual(2);

    response.body.logs.forEach((log: any) => {
      expect(log.entity).toBe('PRODUCT');
      expect(log.entityId).toBe(entityId);
    });

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { entityId },
    });
  });

  it('should paginate results', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'ADMIN');

    // Criar 15 logs para testar paginação
    const logs = Array.from({ length: 15 }, (_, i) => ({
      action: 'CREATE' as const,
      entity: 'PRODUCT' as const,
      module: 'STOCK' as const,
      entityId: `product-pagination-${i}`,
      newData: { name: `Product ${i}` },
      userId: user.id,
    }));

    await prisma.auditLog.createMany({ data: logs });

    const response = await request(app.server)
      .get('/v1/audit-logs?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.logs.length).toBeLessThanOrEqual(10);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(10);
    expect(response.body.pagination.totalPages).toBeGreaterThan(0);

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: {
        entityId: { startsWith: 'product-pagination-' },
      },
    });
  });

  it('should require authentication', async () => {
    const response = await request(app.server).get('/v1/audit-logs');

    expect(response.statusCode).toBe(401);
  });
});
