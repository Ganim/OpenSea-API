import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update POS Terminal Session Mode (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    // Explicit POS permissions because the seeded `admin-test` group lacks
    // `sales.pos.*` codes (see Task 23 context). `sales.pos.admin` guards the
    // endpoint under test; `sales.pos.terminals.register` is required to
    // create the terminal under test via the POST controller.
    const auth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['sales.pos.admin', 'sales.pos.terminals.register'],
    });
    token = auth.token;
  });

  async function createTerminal(): Promise<string> {
    const response = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        terminalName: `Session Mode Terminal ${Date.now()}`,
        mode: 'SALES_ONLY',
      });
    expect(response.status).toBe(201);
    return response.body.terminal.id;
  }

  it('should return 401/400/403 without token', async () => {
    const response = await request(app.server)
      .patch('/v1/pos/terminals/00000000-0000-0000-0000-000000000001/config')
      .send({ operatorSessionMode: 'PER_SALE' });

    expect([400, 401, 403]).toContain(response.status);
    expect(response.status).not.toBe(200);
  });

  it('should update session mode to STAY_LOGGED_IN with timeout (200)', async () => {
    const terminalId = await createTerminal();

    const response = await request(app.server)
      .patch(`/v1/pos/terminals/${terminalId}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        operatorSessionMode: 'STAY_LOGGED_IN',
        operatorSessionTimeout: 1800,
        coordinationMode: 'CASHIER',
      });

    expect(response.status).toBe(200);
    expect(response.body.terminal.operatorSessionMode).toBe('STAY_LOGGED_IN');
    expect(response.body.terminal.operatorSessionTimeout).toBe(1800);
    expect(response.body.terminal.coordinationMode).toBe('CASHIER');
  });

  it('should force operatorSessionTimeout to null when mode is PER_SALE (200)', async () => {
    const terminalId = await createTerminal();

    const stayResponse = await request(app.server)
      .patch(`/v1/pos/terminals/${terminalId}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        operatorSessionMode: 'STAY_LOGGED_IN',
        operatorSessionTimeout: 900,
      });
    expect(stayResponse.status).toBe(200);

    const switchResponse = await request(app.server)
      .patch(`/v1/pos/terminals/${terminalId}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        operatorSessionMode: 'PER_SALE',
        operatorSessionTimeout: 600,
      });

    expect(switchResponse.status).toBe(200);
    expect(switchResponse.body.terminal.operatorSessionMode).toBe('PER_SALE');
    expect(switchResponse.body.terminal.operatorSessionTimeout).toBeNull();
  });

  it('should accept and store autoCloseSessionAt in HH:MM format (200)', async () => {
    const terminalId = await createTerminal();

    const response = await request(app.server)
      .patch(`/v1/pos/terminals/${terminalId}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        operatorSessionMode: 'PER_SALE',
        autoCloseSessionAt: '23:30',
      });

    expect(response.status).toBe(200);
    expect(response.body.terminal.autoCloseSessionAt).toBe('23:30');
  });

  it('should reject invalid autoCloseSessionAt format (400)', async () => {
    const terminalId = await createTerminal();

    const response = await request(app.server)
      .patch(`/v1/pos/terminals/${terminalId}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        operatorSessionMode: 'PER_SALE',
        autoCloseSessionAt: '25:99',
      });

    expect(response.status).toBe(400);
  });

  it('should reject STAY_LOGGED_IN without operatorSessionTimeout (400)', async () => {
    const terminalId = await createTerminal();

    const response = await request(app.server)
      .patch(`/v1/pos/terminals/${terminalId}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        operatorSessionMode: 'STAY_LOGGED_IN',
      });

    expect(response.status).toBe(400);
  });

  it('should return 404 when terminal does not exist', async () => {
    const missingTerminalId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .patch(`/v1/pos/terminals/${missingTerminalId}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send({ operatorSessionMode: 'PER_SALE' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});
