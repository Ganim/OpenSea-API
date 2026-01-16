import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Process Scheduled Notifications (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should process scheduled notifications with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    // Create scheduled notification in the past
    const pastDate = new Date(Date.now() - 60000); // 1 minute ago
    await prisma.notification.create({
      data: {
        userId: user.user.id,
        title: 'Scheduled Test',
        message: 'This was scheduled',
        type: 'INFO',
        priority: 'NORMAL',
        channel: 'IN_APP',
        scheduledFor: pastDate,
      },
    });

    const response = await request(app.server)
      .post('/v1/notifications/process-scheduled')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('processed');
    expect(response.body).toHaveProperty('errors');
    expect(typeof response.body.processed).toBe('number');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });
});
