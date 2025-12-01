import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Link User to Employee (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should link user to employee as MANAGER', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employee } = await createEmployeeE2E();

    // Create a different user to link
    const { user: userToLink } = await createAndAuthenticateUser(app, 'USER');

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/link-user`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: userToLink.user.id,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee.userId).toBe(userToLink.user.id);
  });

  it('should link user to employee as ADMIN', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const { employee } = await createEmployeeE2E();
    const { user: userToLink } = await createAndAuthenticateUser(app, 'USER');

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/link-user`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: userToLink.user.id,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.employee.userId).toBe(userToLink.user.id);
  });

  it('should NOT allow USER to link user to employee', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employee } = await createEmployeeE2E();
    const { user: userToLink } = await createAndAuthenticateUser(app, 'USER');

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/link-user`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: userToLink.user.id,
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 404 when employee does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const { user: userToLink } = await createAndAuthenticateUser(app, 'USER');

    const response = await request(app.server)
      .post(`/v1/hr/employees/${nonExistentId}/link-user`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: userToLink.user.id,
      });

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const { employee } = await createEmployeeE2E();
    const { user: userToLink } = await createAndAuthenticateUser(app, 'USER');

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/link-user`)
      .send({
        userId: userToLink.user.id,
      });

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when user does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employee } = await createEmployeeE2E();
    const nonExistentUserId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/link-user`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: nonExistentUserId,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('Failed to link user');
  });
});
