import { beforeEach, describe, expect, it } from 'vitest';
import { GetSystemHealthUseCase } from './get-system-health';

let sut: GetSystemHealthUseCase;

describe('GetSystemHealthUseCase', () => {
  beforeEach(() => {
    sut = new GetSystemHealthUseCase();
  });

  it('should return system health status', async () => {
    const { health } = await sut.execute();

    expect(health.status).toBe('healthy');
    expect(health.uptime).toBeGreaterThanOrEqual(0);
    expect(health.timestamp).toBeInstanceOf(Date);
  });

  it('should return all service statuses', async () => {
    const { health } = await sut.execute();

    expect(health.services.api).toHaveProperty('status');
    expect(health.services.api).toHaveProperty('uptime');
    expect(health.services.database).toHaveProperty('status');
    expect(health.services.database).toHaveProperty('latencyMs');
    expect(health.services.redis).toHaveProperty('status');
    expect(health.services.redis).toHaveProperty('latencyMs');
  });

  it('should return healthy status for all placeholder services', async () => {
    const { health } = await sut.execute();

    expect(health.services.api.status).toBe('healthy');
    expect(health.services.database.status).toBe('healthy');
    expect(health.services.redis.status).toBe('healthy');
  });
});
