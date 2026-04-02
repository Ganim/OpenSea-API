import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Get Public Chatbot Config (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 404 for non-existent tenant slug', async () => {
    const response = await request(app.server).get(
      '/v1/public/chatbot/non-existent-slug/config',
    );

    expect(response.status).toBe(404);
  });

  it('should not require authentication (public endpoint)', async () => {
    const response = await request(app.server).get(
      '/v1/public/chatbot/any-slug/config',
    );

    // Should not return 401 — public endpoint
    expect(response.status).not.toBe(401);
  });
});
