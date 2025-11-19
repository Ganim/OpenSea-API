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

  it('should send email notification', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');

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
    expect(response.body.success).toBe(true);
    expect(response.body.notification.id).toBe(notification.id);

    // Verify notification was marked as sent
    const updatedNotification = await prisma.notification.findUnique({
      where: { id: notification.id },
    });

    expect(updatedNotification?.isSent).toBe(true);
    expect(updatedNotification?.sentAt).toBeDefined();
  });

  it('should not send already sent notification', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');

    // Create notification already sent
    const notification = await prisma.notification.create({
      data: {
        userId: user.user.id,
        title: 'Already Sent',
        message: 'This was already sent',
        type: 'INFO',
        priority: 'NORMAL',
        channel: 'EMAIL',
        isSent: true,
        sentAt: new Date(),
      },
    });

    const response = await request(app.server)
      .post(`/v1/notifications/${notification.id}/send`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);
  });

  it('should not send non-email channel notification', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');

    // Create IN_APP notification
    const notification = await prisma.notification.create({
      data: {
        userId: user.user.id,
        title: 'In-App Notification',
        message: 'This is in-app only',
        type: 'INFO',
        priority: 'NORMAL',
        channel: 'IN_APP',
      },
    });

    const response = await request(app.server)
      .post(`/v1/notifications/${notification.id}/send`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);
  });

  it('should respect disabled preference', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');

    // Create disabled preference
    await prisma.notificationPreference.create({
      data: {
        userId: user.user.id,
        alertType: 'LOW_STOCK',
        channel: 'EMAIL',
        isEnabled: false,
      },
    });

    // Create notification with matching entityType
    const notification = await prisma.notification.create({
      data: {
        userId: user.user.id,
        title: 'Low Stock Alert',
        message: 'Product X is low on stock',
        type: 'WARNING',
        priority: 'HIGH',
        channel: 'EMAIL',
        entityType: 'LOW_STOCK',
      },
    });

    const response = await request(app.server)
      .post(`/v1/notifications/${notification.id}/send`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);
  });

  it('should not send notification that does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const response = await request(app.server)
      .post('/v1/notifications/00000000-0000-0000-0000-000000000000/send')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
  });
});
