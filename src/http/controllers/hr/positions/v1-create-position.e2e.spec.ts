import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generatePositionData } from '@/utils/tests/factories/hr/create-position.e2e';

describe('Create Position (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create position with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const positionData = generatePositionData();

    const response = await request(app.server)
      .post('/v1/hr/positions')
      .set('Authorization', `Bearer ${token}`)
      .send(positionData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('position');
    expect(response.body.position).toHaveProperty('id');
    expect(response.body.position.name).toBe(positionData.name);
    expect(response.body.position.code).toBe(positionData.code);
  });
});
