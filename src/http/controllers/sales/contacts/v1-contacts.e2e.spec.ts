import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Contacts CRUD (E2E)', () => {
  let tenantId: string;
  let token: string;
  let customerId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    // Create a customer to associate contacts with
    const timestamp = Date.now();
    const customerResponse = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Customer E2E ${timestamp}`,
        type: 'BUSINESS',
        email: `customer-e2e-${timestamp}@example.com`,
      });

    customerId = customerResponse.body.customer.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/contacts should create a contact', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        firstName: `John ${timestamp}`,
        lastName: 'Doe',
        email: `john-${timestamp}@example.com`,
        phone: '+5511999990000',
        role: 'DECISION_MAKER',
        lifecycleStage: 'LEAD',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('contact');
    expect(response.body.contact).toHaveProperty('id');
    expect(response.body.contact.firstName).toContain('John');
    expect(response.body.contact.lastName).toBe('Doe');
    expect(response.body.contact.role).toBe('DECISION_MAKER');
    expect(response.body.contact.customerId).toBe(customerId);
  });

  it('GET /v1/contacts should list contacts with pagination', async () => {
    const response = await request(app.server)
      .get('/v1/contacts')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('contacts');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.contacts)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });

  it('GET /v1/contacts/:contactId should return a contact', async () => {
    // First create a contact
    const timestamp = Date.now();
    const createRes = await request(app.server)
      .post('/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        firstName: `Jane ${timestamp}`,
        email: `jane-${timestamp}@example.com`,
      });

    const contactId = createRes.body.contact.id;

    const response = await request(app.server)
      .get(`/v1/contacts/${contactId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('contact');
    expect(response.body.contact.id).toBe(contactId);
    expect(response.body.contact.firstName).toContain('Jane');
  });

  it('PUT /v1/contacts/:contactId should update a contact', async () => {
    // First create a contact
    const timestamp = Date.now();
    const createRes = await request(app.server)
      .post('/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        firstName: `Update ${timestamp}`,
      });

    const contactId = createRes.body.contact.id;

    const response = await request(app.server)
      .put(`/v1/contacts/${contactId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Updated Name',
        lifecycleStage: 'QUALIFIED',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('contact');
    expect(response.body.contact.firstName).toBe('Updated Name');
    expect(response.body.contact.lifecycleStage).toBe('QUALIFIED');
  });

  it('DELETE /v1/contacts/:contactId should delete a contact', async () => {
    // First create a contact
    const timestamp = Date.now();
    const createRes = await request(app.server)
      .post('/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        firstName: `Delete ${timestamp}`,
      });

    const contactId = createRes.body.contact.id;

    const response = await request(app.server)
      .delete(`/v1/contacts/${contactId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
