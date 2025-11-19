import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { env } from '@/@env';
import { InMemoryNotificationPreferencesRepository } from '@/repositories/sales/in-memory/in-memory-notification-preferences-repository';

// NOTE: This is a simplified E2E leveraging existing Fastify instance.
// Assumes authentication setup with JWT; here we stub a user and sign token directly via prisma + fastify jwt.

async function createAndAuthUser() {
  const user = await prisma.user.create({
    data: {
      email: `user-${Date.now()}@example.com`,
      password_hash: 'hash',
      username: `user-${Date.now()}`,
      role: 'USER',
    },
  });
  const token = await app.jwt.sign({ sub: user.id }, { sign: { expiresIn: '1h' } });
  return { user, token };
}

describe('Notifications E2E', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create, list, and manually send email notification (preference enabled)', async () => {
    const { user, token } = await createAndAuthUser();

    // Direct insert notification scheduled for manual send (channel EMAIL)
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Manual envio',
        message: 'Teste de envio manual',
        type: 'INFO',
        priority: 'NORMAL',
        channel: 'EMAIL',
      },
    });

    // Send
    const sendRes = await request(app.server)
      .post(`/v1/notifications/${notification.id}/send`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(sendRes.body.success).toBe(true);

    // List after send
    const listRes = await request(app.server)
      .get('/v1/notifications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const found = listRes.body.notifications.find((n: any) => n.id === notification.id);
    expect(found).toBeDefined();
    expect(found.isSent).toBe(true);
  });

  it('should respect disabled preference and block manual send', async () => {
    const { user, token } = await createAndAuthUser();

    // Disable preference for LOW_STOCK + EMAIL
    await prisma.notificationPreference.create({
      data: {
        userId: user.id,
        alertType: 'LOW_STOCK',
        channel: 'EMAIL',
        isEnabled: false,
      },
    });

    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Estoque baixo',
        message: 'Alerta estoque baixo',
        type: 'WARNING',
        priority: 'NORMAL',
        channel: 'EMAIL',
        entityType: 'LOW_STOCK',
      },
    });

    const sendRes = await request(app.server)
      .post(`/v1/notifications/${notification.id}/send`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(sendRes.body).toMatchObject({ error: expect.any(String) });
  });
});
