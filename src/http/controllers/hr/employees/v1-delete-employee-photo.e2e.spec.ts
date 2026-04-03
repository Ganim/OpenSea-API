import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Delete Employee Photo (E2E)', () => {
  let tenantId: string;
  let testImageBuffer: Buffer;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;

    testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();
  });


  it('should delete employee photo', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    // Upload a photo first
    const upload = await request(app.server)
      .post(`/v1/hr/employees/${employeeId}/photo`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testImageBuffer, {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      });

    expect(upload.status).toBe(200);

    // Delete the photo
    const response = await request(app.server)
      .delete(`/v1/hr/employees/${employeeId}/photo`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);

    // Verify photo is gone
    const employee = await request(app.server)
      .get(`/v1/hr/employees/${employeeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(employee.body.employee.photoUrl).toBeNull();
  });

  it('should return 204 even if employee has no photo', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    const response = await request(app.server)
      .delete(`/v1/hr/employees/${employeeId}/photo`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 for non-existent employee', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .delete(`/v1/hr/employees/${fakeId}/photo`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).delete(
      '/v1/hr/employees/00000000-0000-0000-0000-000000000000/photo',
    );

    expect(response.status).toBe(401);
  });
});
