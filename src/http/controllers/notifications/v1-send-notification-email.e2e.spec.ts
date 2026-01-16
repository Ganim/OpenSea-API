import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Send Notification Email (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should send email notification with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: user.user.id,
        title: 'Test Email Notification',
        message: 'This is a test email notification',
        type: 'INFO',
        priority: 'NORMAL',
        channel: 'EMAIL',
      },
    });

    const response = await request(app.server)
      .post(`/v1/notifications/${notification.id}/send`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('notification');
    expect(response.body.success).toBe(true);
    expect(response.body.notification.id).toBe(notification.id);
  });
});
