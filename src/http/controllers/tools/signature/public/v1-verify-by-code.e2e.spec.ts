import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Verify Signature By Code (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should return 404 for unknown verification code', async () => {
    const response = await request(app.server).get(
      '/v1/signature/verify/UNKNOWN-CODE-12345',
    );

    expect(response.status).toBe(404);
  });

  it('should not require JWT authentication (public endpoint)', async () => {
    const response = await request(app.server).get(
      '/v1/signature/verify/some-code',
    );

    // Should return 404 from invalid code, NOT 401 from missing JWT
    expect(response.status).not.toBe(401);
  });
});
