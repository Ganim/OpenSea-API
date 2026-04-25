import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Regenerate Employee Short ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });

  it('should regenerate the employee public shortId', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const initialShortId = 'OLDOLD';
    const { employee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });
    await prisma.employee.update({
      where: { id: employee.id },
      data: { shortId: initialShortId },
    });

    const response = await request(app.server)
      .patch(`/v1/hr/employees/${employee.id}/regenerate-short-id`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employee');
    expect(response.body).toHaveProperty('previousShortId', initialShortId);
    expect(response.body.employee.shortId).toBeDefined();
    expect(response.body.employee.shortId).not.toBeNull();
    expect(response.body.employee.shortId).toHaveLength(6);
    expect(response.body.employee.shortId).not.toBe(initialShortId);

    const persisted = await prisma.employee.findUnique({
      where: { id: employee.id },
      select: { shortId: true },
    });
    expect(persisted?.shortId).toBe(response.body.employee.shortId);
  });

  it('should return 404 when employee does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const missingEmployeeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .patch(`/v1/hr/employees/${missingEmployeeId}/regenerate-short-id`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});
