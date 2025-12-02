import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Get Overtime (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get overtime by id', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();

    const overtime = await prisma.overtime.create({
      data: {
        employeeId,
        date: new Date('2024-01-15'),
        hours: 2.5,
        reason: 'Project deadline meeting',
        approved: false,
      },
    });

    const response = await request(app.server)
      .get(`/v1/hr/overtime/${overtime.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('overtime');
    expect(response.body.overtime.id).toBe(overtime.id);
    expect(response.body.overtime.employeeId).toBe(employeeId);
    expect(response.body.overtime.hours).toBe(2.5);
    expect(response.body.overtime.reason).toBe('Project deadline meeting');
    expect(response.body.overtime.approved).toBe(false);
  });

  it('should get approved overtime with approver info', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();

    const overtime = await prisma.overtime.create({
      data: {
        employeeId,
        date: new Date('2024-01-20'),
        hours: 3,
        reason: 'Client emergency support',
        approved: true,
        approvedBy: user.user.id.toString(),
        approvedAt: new Date(),
      },
    });

    const response = await request(app.server)
      .get(`/v1/hr/overtime/${overtime.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.overtime.approved).toBe(true);
    expect(response.body.overtime.approvedBy).toBe(user.user.id.toString());
    expect(response.body.overtime.approvedAt).toBeDefined();
  });

  it('should return 404 for non-existent overtime', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const nonExistentUUID = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/hr/overtime/${nonExistentUUID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const validUUID = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.server).get(
      `/v1/hr/overtime/${validUUID}`,
    );

    expect(response.statusCode).toBe(401);
  });
});
