import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Revoke Operator of POS Terminal (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    // Explicit POS permissions because the seeded `admin-test` group lacks
    // `sales.pos.*` codes (see Task 23 context). `sales.pos.admin` guards the
    // endpoint under test; `sales.pos.terminals.register` is required to
    // create a terminal via the POST controller; `hr.employees.admin` lets
    // `createEmployeeE2E` succeed.
    const auth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [
        'sales.pos.admin',
        'sales.pos.terminals.register',
        'hr.employees.admin',
        'hr.employees.register',
      ],
    });
    token = auth.token;
  });

  async function createTerminal(): Promise<string> {
    const response = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        terminalName: `Revoke Test Terminal ${Date.now()}`,
        mode: 'SALES_ONLY',
      });
    expect(response.status).toBe(201);
    return response.body.terminal.id;
  }

  async function assignEmployeeToTerminal(
    terminalId: string,
    employeeId: string,
  ): Promise<void> {
    const response = await request(app.server)
      .post(`/v1/pos/terminals/${terminalId}/operators`)
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId });
    expect(response.status).toBe(200);
  }

  it('should return 401/400/403 without token', async () => {
    const response = await request(app.server)
      .delete(
        '/v1/pos/terminals/00000000-0000-0000-0000-000000000001/operators/00000000-0000-0000-0000-000000000002',
      )
      .send();

    expect([400, 401, 403]).toContain(response.status);
    expect(response.status).not.toBe(200);
  });

  it('should revoke an active operator link (200)', async () => {
    const terminalId = await createTerminal();
    const { employee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });
    await assignEmployeeToTerminal(terminalId, employee.id);

    const response = await request(app.server)
      .delete(`/v1/pos/terminals/${terminalId}/operators/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('operator');
    expect(response.body.operator.terminalId).toBe(terminalId);
    expect(response.body.operator.employeeId).toBe(employee.id);
    expect(response.body.operator.isActive).toBe(false);
    expect(response.body.operator.revokedAt).not.toBeNull();
    expect(response.body.operator.revokedByUserId).not.toBeNull();
  });

  it('should return 404 when operator link does not exist', async () => {
    const terminalId = await createTerminal();
    const { employee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });

    const response = await request(app.server)
      .delete(`/v1/pos/terminals/${terminalId}/operators/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 400 when the operator link is already revoked', async () => {
    const terminalId = await createTerminal();
    const { employee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });
    await assignEmployeeToTerminal(terminalId, employee.id);

    const firstResponse = await request(app.server)
      .delete(`/v1/pos/terminals/${terminalId}/operators/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(firstResponse.status).toBe(200);

    const duplicateResponse = await request(app.server)
      .delete(`/v1/pos/terminals/${terminalId}/operators/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.body).toHaveProperty('message');
  });
});
