import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Entity History (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return complete entity history', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const entityId = 'test-entity-history-123';

    // Criar histórico completo (CREATE → UPDATE → UPDATE)
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'CREATE',
          entity: 'PRODUCT',
          module: 'STOCK',
          entityId,
          newData: { name: 'V1', price: 100 },
          userId: user.user.id,
          createdAt: new Date('2025-01-01T10:00:00Z'),
        },
        {
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
    expect(response.body.history).toBeInstanceOf(Array);
    expect(response.body.history.length).toBe(3);

    // Verificar ordenação cronológica (mais antigo primeiro)
    expect(response.body.history[0].version).toBe(1);
    expect(response.body.history[0].action).toBe('CREATE');
    expect(response.body.history[1].version).toBe(2);
    expect(response.body.history[1].action).toBe('UPDATE');
    expect(response.body.history[2].version).toBe(3);
    expect(response.body.history[2].action).toBe('UPDATE');

    // Verificar que UPDATEs incluem changes
    expect(response.body.history[1].changes).toBeDefined();
    expect(response.body.history[2].changes).toBeDefined();

    // Cleanup
    await prisma.auditLog.deleteMany({
      where: { entityId },
    });
  });

  it('should return empty history for non-existent entity', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/audit-logs/history/PRODUCT/non-existent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.history).toBeInstanceOf(Array);
    expect(response.body.history.length).toBe(0);
  });

  it('should require authentication', async () => {
    const response = await request(app.server).get(
      '/v1/audit-logs/history/PRODUCT/test-id',
    );

    expect(response.statusCode).toBe(401);
  });
});
