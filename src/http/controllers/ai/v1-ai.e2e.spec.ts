import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('AI Assistant (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  afterAll(async () => {
    await app.close();
  });

  // --- Chat ---

  it('POST /v1/ai/chat should send a message (200)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Ola',
        context: 'DEDICATED',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('conversationId');
    expect(response.body).toHaveProperty('userMessage');
    expect(response.body).toHaveProperty('assistantMessage');
  });

  it('GET /v1/ai/chat/conversations should list conversations (200)', async () => {
    const response = await request(app.server)
      .get('/v1/ai/chat/conversations')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('conversations');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.conversations)).toBe(true);
  });

  // --- Insights ---

  it('GET /v1/ai/insights should list insights (200)', async () => {
    const response = await request(app.server)
      .get('/v1/ai/insights')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('insights');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.insights)).toBe(true);
  });

  // --- Config ---

  it('GET /v1/ai/config should get AI config (200)', async () => {
    const response = await request(app.server)
      .get('/v1/ai/config')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('config');
  });

  // --- Favorites ---

  it('GET /v1/ai/favorites should list favorites (200)', async () => {
    const response = await request(app.server)
      .get('/v1/ai/favorites')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('favorites');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.favorites)).toBe(true);
  });

  it('POST /v1/ai/favorites should create a favorite (201)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: 'vendas do mes',
        category: 'SALES',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('favorite');
    expect(response.body.favorite).toHaveProperty('id');
    expect(response.body.favorite.query).toBe('vendas do mes');
  });

  // --- Actions ---

  it('GET /v1/ai/actions should list action logs (200)', async () => {
    const response = await request(app.server)
      .get('/v1/ai/actions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('actions');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.actions)).toBe(true);
  });
});
