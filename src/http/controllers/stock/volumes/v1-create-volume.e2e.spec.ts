import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Volume (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a volume successfully', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/volumes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Volume de Teste',
        notes: 'Notas do volume',
        destinationRef: 'REF-001',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('volume');
    expect(response.body.volume).toHaveProperty('id');
    expect(response.body.volume).toHaveProperty('code');
    expect(response.body.volume.name).toBe('Volume de Teste');
    expect(response.body.volume.status).toBe('OPEN');
  });
});
