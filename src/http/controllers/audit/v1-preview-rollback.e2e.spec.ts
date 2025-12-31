import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

interface RollbackChange {
  field: string;
  from: unknown;
  to: unknown;
}

describe('Preview Rollback (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should preview rollback successfully for UPDATE action', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const entityId = 'preview-rollback-test-1';

    // Criar um UPDATE log (pode fazer rollback)
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
    expect(response.body.preview).toBeDefined();
    expect(response.body.preview.canRollback).toBe(true);
    expect(response.body.preview.targetState).toEqual({
      name: 'Old Name',
      price: 100.0,
    });
    expect(response.body.preview.currentState).toEqual({
      name: 'New Name',
      price: 150.0,
    });
    expect(response.body.preview.changes).toBeInstanceOf(Array);
    expect(response.body.preview.changes.length).toBeGreaterThan(0);

    // Verificar que as mudanças estão corretas
    const nameChange = response.body.preview.changes.find(
      (c: RollbackChange) => c.field === 'name',
    );
    expect(nameChange).toEqual({
      field: 'name',
      from: 'New Name',
      to: 'Old Name',
    });

    const priceChange = response.body.preview.changes.find(
      (c: RollbackChange) => c.field === 'price',
    );
    expect(priceChange).toEqual({
      field: 'price',
      from: 150.0,
      to: 100.0,
    });

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { entityId },
    });
  });

  it('should return canRollback false for CREATE action', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const entityId = 'preview-rollback-test-create';

    // Criar um CREATE log (não pode fazer rollback)
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'PRODUCT',
        module: 'STOCK',
        entityId,
        newData: { name: 'New Product', price: 200.0 },
        userId: user.user.id,
      },
    });

    const response = await request(app.server)
      .get(`/v1/audit-logs/rollback/preview/PRODUCT/${entityId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.preview.canRollback).toBe(false);
    expect(response.body.preview.reason).toBe(
      'Cannot rollback a CREATE action',
    );
    expect(response.body.preview.targetState).toBeNull();
    expect(response.body.preview.currentState).toEqual({
      name: 'New Product',
      price: 200.0,
    });
    expect(response.body.preview.changes).toEqual([]);

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { entityId },
    });
  });

  it('should return canRollback false when no logs exist', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/audit-logs/rollback/preview/PRODUCT/non-existent-entity')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.preview.canRollback).toBe(false);
    expect(response.body.preview.reason).toBe(
      'No audit logs found for this entity',
    );
    expect(response.body.preview.targetState).toBeNull();
    expect(response.body.preview.currentState).toBeNull();
    expect(response.body.preview.changes).toEqual([]);
  });

  it('should use the most recent UPDATE when multiple UPDATEs exist', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const entityId = 'preview-rollback-multiple-updates';

    // Criar múltiplos UPDATEs
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'CREATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          newData: { name: 'V1', price: 100.0 },
          userId: user.user.id,
          createdAt: new Date('2025-01-01T10:00:00Z'),
        },
        {
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'V1', price: 100.0 },
          newData: { name: 'V2', price: 150.0 },
          userId: user.user.id,
          createdAt: new Date('2025-01-02T10:00:00Z'),
        },
        {
          action: 'UPDATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          oldData: { name: 'V2', price: 150.0 },
          newData: { name: 'V3', price: 200.0 },
          userId: user.user.id,
          createdAt: new Date('2025-01-03T10:00:00Z'),
        },
      ],
    });

    const response = await request(app.server)
      .get(`/v1/audit-logs/rollback/preview/PRODUCT/${entityId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.preview.canRollback).toBe(true);

    // Deve usar o oldData do UPDATE mais recente (V3 -> V2)
    expect(response.body.preview.targetState).toEqual({
      name: 'V2',
      price: 150.0,
    });
    expect(response.body.preview.currentState).toEqual({
      name: 'V3',
      price: 200.0,
    });

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { entityId },
    });
  });

  it('should calculate changes correctly with partial data', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const entityId = 'preview-rollback-partial';

    // UPDATE com apenas alguns campos alterados
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'PRODUCT',
        module: 'STOCK',
        entityId,
        oldData: { name: 'Product', price: 100.0, sku: 'SKU-001', stock: 10 },
        newData: {
          name: 'Product Updated',
          price: 100.0,
          sku: 'SKU-001',
          stock: 10,
        },
        userId: user.user.id,
      },
    });

    const response = await request(app.server)
      .get(`/v1/audit-logs/rollback/preview/PRODUCT/${entityId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.preview.canRollback).toBe(true);

    // Deve mostrar apenas o campo que mudou
    expect(response.body.preview.changes).toHaveLength(1);
    expect(response.body.preview.changes[0]).toEqual({
      field: 'name',
      from: 'Product Updated',
      to: 'Product',
    });

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { entityId },
    });
  });

  it('should require authentication', async () => {
    const response = await request(app.server).get(
      '/v1/audit-logs/rollback/preview/PRODUCT/test-id',
    );

    expect(response.statusCode).toBe(401);
  });

  it('should validate entity type', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/audit-logs/rollback/preview/INVALID_ENTITY/test-id')
      .set('Authorization', `Bearer ${token}`);

    // Zod validation error
    expect(response.statusCode).toBe(400);
  });
});
