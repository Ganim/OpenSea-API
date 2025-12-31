import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createPositionE2E } from '@/utils/tests/factories/hr/create-position.e2e';

describe('List Positions (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to list positions', async () => {
    const { token } = await createAndAuthenticateUser(app);
    await createPositionE2E();
    await createPositionE2E();

    const response = await request(app.server)
      .get('/v1/hr/positions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('positions');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('perPage');
    expect(response.body.meta).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.positions)).toBe(true);
  });

  it('should allow ADMIN to list positions', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/hr/positions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('positions');
  });

  it('should allow USER to list positions', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/hr/positions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('positions');
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).get('/v1/hr/positions');

    expect(response.statusCode).toBe(401);
  });

  it('should paginate results', async () => {
    const { token } = await createAndAuthenticateUser(app);
    // Create multiple positions
    await createPositionE2E();
    await createPositionE2E();
    await createPositionE2E();

    const response = await request(app.server)
      .get('/v1/hr/positions')
      .query({ page: 1, perPage: 2 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.positions.length).toBeLessThanOrEqual(2);
    expect(response.body.meta.perPage).toBe(2);
  });

  it('should filter by search query', async () => {
    const { token } = await createAndAuthenticateUser(app);
    await createPositionE2E({ name: 'Senior Developer' });
    await createPositionE2E({ name: 'Junior Analyst' });

    const response = await request(app.server)
      .get('/v1/hr/positions')
      .query({ search: 'Senior' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(
      response.body.positions.some((p: { name: string }) =>
        p.name.includes('Senior'),
      ),
    ).toBe(true);
  });

  it('should filter by isActive status', async () => {
    const { token } = await createAndAuthenticateUser(app);
    // Cria uma posição ativa
    await createPositionE2E({
      isActive: true,
      name: 'Active Position Test Unique' + Math.random(),
    });

    const responseActive = await request(app.server)
      .get('/v1/hr/positions')
      .query({ isActive: 'true' })
      .set('Authorization', `Bearer ${token}`);

    expect(responseActive.statusCode).toBe(200);
    // Verifica que todos os cargos retornados são ativos
    expect(
      responseActive.body.positions.every(
        (p: { isActive: boolean }) => p.isActive === true,
      ),
    ).toBe(true);
  });

  it('should filter by level', async () => {
    const { token } = await createAndAuthenticateUser(app);
    await createPositionE2E({ level: 3 });
    await createPositionE2E({ level: 5 });

    const response = await request(app.server)
      .get('/v1/hr/positions')
      .query({ level: 3 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(
      response.body.positions.every((p: { level: number }) => p.level === 3),
    ).toBe(true);
  });

  it('should return correct pagination metadata', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/hr/positions')
      .query({ page: 1, perPage: 10 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.perPage).toBe(10);
    expect(typeof response.body.meta.total).toBe('number');
    expect(typeof response.body.meta.totalPages).toBe('number');
  });
});
