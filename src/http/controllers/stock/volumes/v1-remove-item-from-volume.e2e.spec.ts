import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';
import { createVolumeE2E } from '@/utils/tests/factories/stock/create-volume.e2e';

describe('Remove Item from Volume (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should remove an item from a volume', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { volumeId } = await createVolumeE2E(app, {
      token,
      name: 'Volume para Remover Item',
    });

    const { itemId } = await createItemE2E();

    // Add item to volume
    await request(app.server)
      .post(`/v1/volumes/${volumeId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ itemId });

    // Remove item from volume
    const response = await request(app.server)
      .delete(`/v1/volumes/${volumeId}/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
