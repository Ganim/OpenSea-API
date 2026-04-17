import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Download Signed PDF Public (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should return 404 for unknown access token', async () => {
    const response = await request(app.server).get(
      '/v1/signature/sign/unknown-access-token-abc123/signed-pdf',
    );

    expect(response.status).toBe(404);
  });

  it('should not require JWT authentication (public endpoint)', async () => {
    const response = await request(app.server).get(
      '/v1/signature/sign/some-token/signed-pdf',
    );

    // Should return 404 from invalid token, NOT 401 from missing JWT
    expect(response.status).not.toBe(401);
  });
});
