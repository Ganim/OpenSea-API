import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Workflows (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });


  it('POST /v1/sales/workflows should create a workflow (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/workflows')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Workflow ${timestamp}`,
        trigger: 'ORDER_CREATED',
        steps: [
          {
            order: 1,
            type: 'SEND_EMAIL',
            config: { to: 'test@example.com', subject: 'New order' },
          },
          {
            order: 2,
            type: 'CREATE_TASK',
            config: { title: 'Follow up', assignTo: 'owner' },
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('workflow');
    expect(response.body.workflow).toHaveProperty('id');
    expect(response.body.workflow.name).toBe(`Workflow ${timestamp}`);
    expect(response.body.workflow.trigger).toBe('ORDER_CREATED');
  });

  it('GET /v1/sales/workflows should list workflows (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/workflows')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('workflows');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.workflows)).toBe(true);
  });

  it('GET /v1/sales/workflows/:id should get workflow by id (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/sales/workflows')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Workflow GetById ${Date.now()}`,
        trigger: 'DEAL_WON',
        steps: [
          {
            order: 1,
            type: 'SEND_NOTIFICATION',
            config: { message: 'Deal won!' },
          },
        ],
      });

    const workflowId = createResponse.body.workflow.id;

    const response = await request(app.server)
      .get(`/v1/sales/workflows/${workflowId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('workflow');
    expect(response.body.workflow.id).toBe(workflowId);
  });

  it('DELETE /v1/sales/workflows/:id should soft delete a workflow (204)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/sales/workflows')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Workflow Delete ${Date.now()}`,
        trigger: 'CUSTOMER_CREATED',
      });

    const workflowId = createResponse.body.workflow.id;

    const response = await request(app.server)
      .delete(`/v1/sales/workflows/${workflowId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
