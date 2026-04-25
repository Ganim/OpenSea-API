import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List POS Terminal Operators (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    // Explicit POS permissions because the seeded `admin-test` group lacks
    // `sales.pos.*` codes (see Task 23 context). `sales.pos.admin` guards the
    // endpoint under test; `sales.pos.terminals.register` is required to
    // create a terminal; `hr.employees.admin` lets `createEmployeeE2E`
    // succeed.
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
        terminalName: `List Ops Test Terminal ${Date.now()}`,
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

  async function revokeEmployeeFromTerminal(
    terminalId: string,
    employeeId: string,
  ): Promise<void> {
    const response = await request(app.server)
      .delete(`/v1/pos/terminals/${terminalId}/operators/${employeeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(response.status).toBe(200);
  }

  it('should return 401/400/403 without token', async () => {
    const response = await request(app.server)
      .get('/v1/pos/terminals/00000000-0000-0000-0000-000000000001/operators')
      .send();

    expect([400, 401, 403]).toContain(response.status);
    expect(response.status).not.toBe(200);
  });

  it('should return empty list for a terminal with no operators (200)', async () => {
    const terminalId = await createTerminal();

    const response = await request(app.server)
      .get(`/v1/pos/terminals/${terminalId}/operators`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.data).toEqual([]);
    expect(response.body.meta.total).toBe(0);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(20);
    expect(response.body.meta.pages).toBe(0);
  });

  it('should return active operators by default, enriched with employeeName', async () => {
    const terminalId = await createTerminal();
    const { employee: firstEmployee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });
    const { employee: secondEmployee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });
    await assignEmployeeToTerminal(terminalId, firstEmployee.id);
    await assignEmployeeToTerminal(terminalId, secondEmployee.id);

    const response = await request(app.server)
      .get(`/v1/pos/terminals/${terminalId}/operators`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta.total).toBe(2);
    const returnedEmployeeIds = response.body.data.map(
      (row: { employeeId: string }) => row.employeeId,
    );
    expect(returnedEmployeeIds).toContain(firstEmployee.id);
    expect(returnedEmployeeIds).toContain(secondEmployee.id);

    for (const row of response.body.data) {
      expect(row).toHaveProperty('operatorId');
      expect(row).toHaveProperty('employeeName');
      expect(typeof row.employeeName).toBe('string');
      expect(row.employeeName.length).toBeGreaterThan(0);
      expect(row.isActive).toBe(true);
      expect(row.revokedAt).toBeNull();
    }
  });

  it('should exclude revoked operators by default and include them with isActive=all', async () => {
    const terminalId = await createTerminal();
    const { employee: activeEmployee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });
    const { employee: revokedEmployee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });
    await assignEmployeeToTerminal(terminalId, activeEmployee.id);
    await assignEmployeeToTerminal(terminalId, revokedEmployee.id);
    await revokeEmployeeFromTerminal(terminalId, revokedEmployee.id);

    // Default (active only)
    const defaultResponse = await request(app.server)
      .get(`/v1/pos/terminals/${terminalId}/operators`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(defaultResponse.status).toBe(200);
    expect(defaultResponse.body.data).toHaveLength(1);
    expect(defaultResponse.body.data[0].employeeId).toBe(activeEmployee.id);

    // isActive=all
    const allResponse = await request(app.server)
      .get(`/v1/pos/terminals/${terminalId}/operators?isActive=all`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(allResponse.status).toBe(200);
    expect(allResponse.body.data).toHaveLength(2);
    const employeeIds = allResponse.body.data.map(
      (row: { employeeId: string }) => row.employeeId,
    );
    expect(employeeIds).toContain(activeEmployee.id);
    expect(employeeIds).toContain(revokedEmployee.id);
  });

  it('should paginate correctly with page=2&limit=1', async () => {
    const terminalId = await createTerminal();
    const { employee: firstEmployee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });
    const { employee: secondEmployee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });
    await assignEmployeeToTerminal(terminalId, firstEmployee.id);
    await assignEmployeeToTerminal(terminalId, secondEmployee.id);

    const response = await request(app.server)
      .get(`/v1/pos/terminals/${terminalId}/operators?page=2&limit=1`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.total).toBe(2);
    expect(response.body.meta.page).toBe(2);
    expect(response.body.meta.limit).toBe(1);
    expect(response.body.meta.pages).toBe(2);
  });

  it('should return 404 when terminal does not exist', async () => {
    const missingTerminalId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/pos/terminals/${missingTerminalId}/operators`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});
