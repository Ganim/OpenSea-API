import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createVolumeE2E } from '@/utils/tests/factories/stock/create-volume.e2e';

describe('Return Volume (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should mark a delivered volume as returned', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { volumeId } = await createVolumeE2E(app, {
      token,
      name: 'Volume para Retornar',
    });

    // Close the volume
    await request(app.server)
      .post(`/v1/volumes/${volumeId}/close`)
      .set('Authorization', `Bearer ${token}`);

    // Deliver the volume
    await request(app.server)
      .post(`/v1/volumes/${volumeId}/deliver`)
      .set('Authorization', `Bearer ${token}`);

    // Return the volume
    const response = await request(app.server)
      .post(`/v1/volumes/${volumeId}/return`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('volume');
    expect(response.body.volume.status).toBe('RETURNED');
    expect(response.body.volume.returnedAt).not.toBeNull();
  });
});
