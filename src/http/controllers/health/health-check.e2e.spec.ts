import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

describe('Health Check (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return detailed health check', async () => {
    const response = await request(app.server).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('checks');
    expect(response.body.checks).toHaveProperty('database');
    expect(response.body.checks).toHaveProperty('redis');
    expect(response.body.checks).toHaveProperty('memory');
    expect(response.body.checks).toHaveProperty('system');
    expect(response.body.checks.database).toHaveProperty('status');
    expect(response.body.checks.memory).toHaveProperty('usage');
    expect(response.body.checks.system).toHaveProperty('platform');
  });

  it('should return readiness probe', async () => {
    const response = await request(app.server).get('/health/ready');

    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('checks');
    expect(response.body.checks).toHaveProperty('database');
    expect(response.body.checks).toHaveProperty('redis');
  });

  it('should return liveness probe', async () => {
    const response = await request(app.server).get('/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('alive');
    expect(response.body).toHaveProperty('timestamp');
  });
});
