import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';
import { createVolumeE2E } from '@/utils/tests/factories/stock/create-volume.e2e';

describe('Add Item to Volume (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should add an item to a volume', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now().toString();

    const tenant = await prisma.tenant.create({
      data: {
        name: `tenant-${timestamp}`,
        slug: `tenant-${timestamp}`,
        status: 'ACTIVE',
      },
    });
    const tenantId = tenant.id;

    const { volumeId } = await createVolumeE2E(app, {
      token,
      name: 'Volume com Item',
    });

    const { itemId } = await createItemE2E({ tenantId });

    const response = await request(app.server)
      .post(`/v1/volumes/${volumeId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ itemId });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('volumeItem');
    expect(response.body.volumeItem.itemId).toBe(itemId);
  });
});
