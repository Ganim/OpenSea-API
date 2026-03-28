import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createEmployeeRequestE2E } from '@/utils/tests/factories/hr/create-employee-request.e2e';

describe('Reject Request (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject a pending request with reason', async () => {
    const { token, user: userResponse } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    // Create approver employee linked to the authenticated user
    const userId = userResponse.user.id.toString();
    await createEmployeeE2E({ tenantId, userId, status: 'ACTIVE' });

    // Create a different employee with a pending request
    const { employeeId: requesterEmployeeId } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });

    const { employeeRequestId } = await createEmployeeRequestE2E({
      tenantId,
      employeeId: requesterEmployeeId,
      type: 'ADVANCE',
      status: 'PENDING',
    });

    const response = await request(app.server)
      .post(`/v1/hr/requests/${employeeRequestId}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        rejectionReason: 'Budget constraints for this period',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('employeeRequest');
    expect(response.body.employeeRequest.status).toBe('REJECTED');
    expect(response.body.employeeRequest.rejectionReason).toBe(
      'Budget constraints for this period',
    );
  });

  it('should return 404 for non-existent request', async () => {
    const { token, user: userResponse } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const userId = userResponse.user.id.toString();
    await createEmployeeE2E({ tenantId, userId, status: 'ACTIVE' });

    const response = await request(app.server)
      .post('/v1/hr/requests/00000000-0000-0000-0000-000000000000/reject')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rejectionReason: 'Test rejection',
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});
