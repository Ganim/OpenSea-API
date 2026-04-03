import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Render Landing Page (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });


  it('should return 404 HTML for non-existent landing page', async () => {
    const response = await request(app.server).get(
      '/lp/non-existent-tenant/non-existent-page',
    );

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toContain('text/html');
  });

  it('should not require authentication (public endpoint)', async () => {
    const response = await request(app.server).get('/lp/any-tenant/any-page');

    // Should not return 401 — public endpoint
    expect(response.status).not.toBe(401);
  });
});
