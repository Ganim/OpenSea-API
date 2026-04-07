import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Submit Candidate Data (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should return 404 for non-existent admission token', async () => {
    const response = await request(app.server)
      .post('/v1/public/admission/00000000-0000-0000-0000-000000000000/submit')
      .send({
        candidateData: {
          cpf: '12345678900',
          birthDate: '1990-01-01',
          address: 'Test Street 123',
        },
      });

    expect(response.status).toBe(404);
  });

  it('should not require authentication (public endpoint)', async () => {
    const response = await request(app.server)
      .post('/v1/public/admission/00000000-0000-0000-0000-000000000000/submit')
      .send({
        candidateData: { cpf: '12345678900' },
      });

    // Should not return 401 — public endpoint
    expect(response.status).not.toBe(401);
  });
});
