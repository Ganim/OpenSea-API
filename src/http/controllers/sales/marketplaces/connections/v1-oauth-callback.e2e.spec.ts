import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('OAuth Callback (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });


  it('should handle OAuth callback with code and state', async () => {
    const response = await request(app.server)
      .get('/v1/marketplace/oauth/callback')
      .query({ code: 'test-auth-code', state: 'test-state-123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('code', 'test-auth-code');
    expect(response.body).toHaveProperty('state', 'test-state-123');
  });
});
