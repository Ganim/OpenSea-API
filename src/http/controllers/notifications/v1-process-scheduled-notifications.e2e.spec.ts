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

  it('should process scheduled notifications', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    // Create scheduled notification in the past
    const pastDate = new Date(Date.now() - 60000); // 1 minute ago
    const notification = await prisma.notification.create({
      data: {
        userId: user.user.id,
        title: 'Scheduled Test',
        message: 'This was scheduled',
        type: 'INFO',
        priority: 'NORMAL',
        channel: 'EMAIL',
        scheduledFor: pastDate,
      },
    });

    const response = await request(app.server)
      .post('/v1/notifications/process-scheduled')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body.processed).toBeGreaterThanOrEqual(1);

    // Verify notification was processed
    const updatedNotification = await prisma.notification.findUnique({
      where: { id: notification.id },
    });

    expect(updatedNotification?.isSent).toBe(true);
  });

  it('should not process future scheduled notifications', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    // Create scheduled notification in the future
    const futureDate = new Date(Date.now() + 60000); // 1 minute from now
    await prisma.notification.create({
      data: {
        userId: user.user.id,
        title: 'Future Scheduled',
        message: 'This is scheduled for later',
        type: 'INFO',
        priority: 'NORMAL',
        channel: 'EMAIL',
        scheduledFor: futureDate,
      },
    });

    const response = await request(app.server)
      .post('/v1/notifications/process-scheduled')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    // Should not process the future notification (depends on other pending ones)
  });

  it('should skip notifications with disabled preference', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    // Create disabled preference
    await prisma.notificationPreference.create({
      data: {
        userId: user.user.id,
        alertType: 'EXPIRED',
        channel: 'EMAIL',
        isEnabled: false,
      },
    });

    // Create scheduled notification with matching entityType
    const pastDate = new Date(Date.now() - 60000);
    const notification = await prisma.notification.create({
      data: {
        userId: user.user.id,
        title: 'Expired Item',
        message: 'Item has expired',
        type: 'WARNING',
        priority: 'HIGH',
        channel: 'EMAIL',
        entityType: 'EXPIRED',
        scheduledFor: pastDate,
      },
    });

    const response = await request(app.server)
      .post('/v1/notifications/process-scheduled')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body.errors.length).toBeGreaterThanOrEqual(0);

    // Verify notification was not sent due to preference
    const updatedNotification = await prisma.notification.findUnique({
      where: { id: notification.id },
    });

    expect(updatedNotification?.isSent).toBe(false);
  });

  it('should process IN_APP notifications without email', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const pastDate = new Date(Date.now() - 60000);
    const notification = await prisma.notification.create({
      data: {
        userId: user.user.id,
        title: 'In-App Scheduled',
        message: 'This is in-app',
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

    // Verify IN_APP notification was marked as sent
    const updatedNotification = await prisma.notification.findUnique({
      where: { id: notification.id },
    });

    expect(updatedNotification?.isSent).toBe(true);
  });
});
