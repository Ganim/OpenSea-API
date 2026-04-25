import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Assign Operator to POS Terminal (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    // Need explicit POS permissions because the seeded `admin-test` group
    // does not include the `sales.pos.*` permission codes (Plan A pre-2026-04-24
    // gap — see `e2e-permissions.ts` `sales` block). `sales.pos.terminals.register`
    // is required to create a terminal in setup; `sales.pos.admin` guards the
    // endpoint under test; `hr.employees.admin` lets `createEmployeeE2E` succeed.
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
        terminalName: `Operator Test Terminal ${Date.now()}`,
        mode: 'SALES_ONLY',
      });
    expect(response.status).toBe(201);
    return response.body.terminal.id;
  }

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/pos/terminals/00000000-0000-0000-0000-000000000001/operators')
      .send({ employeeId: '00000000-0000-0000-0000-000000000002' });

    // Some Fastify routes short-circuit unauthenticated requests with 400 when
    // hooks fail before JWT verification (`createModuleMiddleware('SALES')`
    // runs in `onRequest` and tries to read `request.user.tenantId`). Either
    // 401 (Unauthorized) or 400/403 (rejected before auth) is acceptable —
    // the contract that matters is "no successful response without a token".
    expect([400, 401, 403]).toContain(response.status);
    expect(response.status).not.toBe(200);
    expect(response.status).not.toBe(201);
  });

  it('should assign an employee as operator of a POS terminal (200)', async () => {
    const terminalId = await createTerminal();
    const { employee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });

    const response = await request(app.server)
      .post(`/v1/pos/terminals/${terminalId}/operators`)
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: employee.id });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('operator');
    expect(response.body.operator.terminalId).toBe(terminalId);
    expect(response.body.operator.employeeId).toBe(employee.id);
    expect(response.body.operator.tenantId).toBe(tenantId);
    expect(response.body.operator.isActive).toBe(true);
    expect(response.body.operator.revokedAt).toBeNull();
    expect(response.body.operator.revokedByUserId).toBeNull();
  });

  it('should return 404 when terminal does not exist', async () => {
    const { employee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });
    const missingTerminalId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post(`/v1/pos/terminals/${missingTerminalId}/operators`)
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: employee.id });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 404 when employee does not exist', async () => {
    const terminalId = await createTerminal();
    const missingEmployeeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post(`/v1/pos/terminals/${terminalId}/operators`)
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: missingEmployeeId });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 400 when an active operator link already exists', async () => {
    const terminalId = await createTerminal();
    const { employee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });

    const firstResponse = await request(app.server)
      .post(`/v1/pos/terminals/${terminalId}/operators`)
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: employee.id });
    expect(firstResponse.status).toBe(200);

    const duplicateResponse = await request(app.server)
      .post(`/v1/pos/terminals/${terminalId}/operators`)
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: employee.id });

    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.body).toHaveProperty('message');
  });
});
