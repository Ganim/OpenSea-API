import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Handle Chatbot Message (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 404 for non-existent tenant slug', async () => {
    const response = await request(app.server)
      .post('/v1/public/chatbot/non-existent-slug/message')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Hello from test',
      });

    expect(response.status).toBe(404);
  });

  it('should not require authentication (public endpoint)', async () => {
    const response = await request(app.server)
      .post('/v1/public/chatbot/any-slug/message')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Hello',
      });

    // Should not return 401 — public endpoint
    expect(response.status).not.toBe(401);
  });
});
