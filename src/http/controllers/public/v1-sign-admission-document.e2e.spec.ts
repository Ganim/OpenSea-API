import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Sign Admission Document (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });


  it('should return 404 for non-existent admission token', async () => {
    const response = await request(app.server)
      .post('/v1/public/admission/00000000-0000-0000-0000-000000000000/sign')
      .send({
        documentId: '00000000-0000-0000-0000-000000000001',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
      });

    expect(response.status).toBe(404);
  });

  it('should not require authentication (public endpoint)', async () => {
    const response = await request(app.server)
      .post('/v1/public/admission/00000000-0000-0000-0000-000000000000/sign')
      .send({
        documentId: '00000000-0000-0000-0000-000000000001',
        signatureData: 'data:image/png;base64,test',
      });

    // Should not return 401 — public endpoint
    expect(response.status).not.toBe(401);
  });
});
