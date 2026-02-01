import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createManufacturer } from '@/utils/tests/factories/stock/create-manufacturer.e2e';

describe('Delete Manufacturer (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete manufacturer with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const { manufacturer } = await createManufacturer({
      name: `Manufacturer to Delete ${timestamp}`,
    });

    const response = await request(app.server)
      .delete(`/v1/manufacturers/${manufacturer.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
