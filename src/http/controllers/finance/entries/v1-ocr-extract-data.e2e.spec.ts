import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('OCR Extract Data (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without auth on POST /ocr', async () => {
    const response = await request(app.server)
      .post('/v1/finance/entries/ocr')
      .send({});

    expect(response.status).toBe(401);
  });

  it('should return 401 without auth on POST /ocr/upload', async () => {
    const response = await request(app.server).post(
      '/v1/finance/entries/ocr/upload',
    );

    expect(response.status).toBe(401);
  });
});
