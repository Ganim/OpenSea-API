import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createDeduction } from '@/utils/tests/factories/hr/create-deduction.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Delete Deduction (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to delete a deduction', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();
    const deduction = await createDeduction(employeeId);

    const response = await request(app.server)
      .delete(`/v1/hr/deductions/${deduction.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);

    const deletedDeduction = await prisma.deduction.findUnique({
      where: { id: deduction.id },
    });
    expect(deletedDeduction).toBeNull();
  });

  it('should return 404 when deduction not found', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .delete('/v1/hr/deductions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should NOT allow USER to delete a deduction', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();
    const deduction = await createDeduction(employeeId);

    const response = await request(app.server)
      .delete(`/v1/hr/deductions/${deduction.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const { employeeId } = await createEmployeeE2E();
    const deduction = await createDeduction(employeeId);

    const response = await request(app.server).delete(
      `/v1/hr/deductions/${deduction.id}`,
    );

    expect(response.statusCode).toBe(401);
  });
});
