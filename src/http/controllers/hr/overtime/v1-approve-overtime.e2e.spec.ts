import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Approve Overtime (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to approve overtime', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();

    // Create overtime request
    const overtime = await prisma.overtime.create({
      data: {
        employeeId,
        date: new Date('2024-01-15'),
        hours: 2,
        reason: 'Project deadline',
        approved: false,
      },
    });

    const response = await request(app.server)
      .post(`/v1/hr/overtime/${overtime.id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        addToTimeBank: false,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('overtime');
    expect(response.body.overtime.approved).toBe(true);
    expect(response.body.overtime.approvedBy).toBeDefined();
    expect(response.body.overtime.approvedAt).toBeDefined();
  });

  it('should allow approval with time bank credit', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();

    const overtime = await prisma.overtime.create({
      data: {
        employeeId,
        date: new Date('2024-01-15'),
        hours: 3,
        reason: 'Client meeting',
        approved: false,
      },
    });

    const response = await request(app.server)
      .post(`/v1/hr/overtime/${overtime.id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        addToTimeBank: true,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.overtime.approved).toBe(true);

    // Verify time bank was credited
    const timeBank = await prisma.timeBank.findFirst({
      where: { employeeId },
    });
    expect(timeBank).toBeDefined();
    expect(Number(timeBank?.balance)).toBe(3);
  });

  it('should NOT allow USER to approve overtime', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();

    const overtime = await prisma.overtime.create({
      data: {
        employeeId,
        date: new Date('2024-01-15'),
        hours: 2,
        reason: 'Project deadline',
        approved: false,
      },
    });

    const response = await request(app.server)
      .post(`/v1/hr/overtime/${overtime.id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        addToTimeBank: false,
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 400 when overtime already approved', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();

    const overtime = await prisma.overtime.create({
      data: {
        employeeId,
        date: new Date('2024-01-15'),
        hours: 2,
        reason: 'Project deadline',
        approved: true,
        approvedAt: new Date(),
      },
    });

    const response = await request(app.server)
      .post(`/v1/hr/overtime/${overtime.id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        addToTimeBank: false,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('already approved');
  });

  it('should return 404 for non-existent overtime', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const nonExistentUUID = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post(`/v1/hr/overtime/${nonExistentUUID}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        addToTimeBank: false,
      });

    expect(response.statusCode).toBe(404);
  });
});
