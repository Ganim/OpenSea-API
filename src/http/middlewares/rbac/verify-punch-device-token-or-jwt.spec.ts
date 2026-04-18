import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./verify-punch-device-token', () => ({
  verifyPunchDeviceToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./verify-jwt', () => ({
  verifyJwt: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./verify-tenant', () => ({
  verifyTenant: vi.fn().mockResolvedValue(undefined),
}));

import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import type { FastifyRequest } from 'fastify';

import { verifyJwt } from './verify-jwt';
import { verifyPunchDeviceToken } from './verify-punch-device-token';
import { verifyPunchDeviceTokenOrJwt } from './verify-punch-device-token-or-jwt';
import { verifyTenant } from './verify-tenant';

function buildRequest(token?: string): FastifyRequest {
  const headers: Record<string, string> = {};
  if (token !== undefined) headers['x-punch-device-token'] = token;
  return { headers } as unknown as FastifyRequest;
}

describe('verifyPunchDeviceTokenOrJwt', () => {
  beforeEach(() => {
    vi.mocked(verifyPunchDeviceToken).mockClear();
    vi.mocked(verifyJwt).mockClear();
    vi.mocked(verifyTenant).mockClear();

    // Default resolve; individual tests override as needed.
    vi.mocked(verifyPunchDeviceToken).mockResolvedValue(undefined);
    vi.mocked(verifyJwt).mockResolvedValue(undefined);
    vi.mocked(verifyTenant).mockResolvedValue(undefined);
  });

  it('routes to verifyPunchDeviceToken when x-punch-device-token is present and skips JWT path', async () => {
    const request = buildRequest('some-token');

    await verifyPunchDeviceTokenOrJwt(request);

    expect(vi.mocked(verifyPunchDeviceToken)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(verifyPunchDeviceToken)).toHaveBeenCalledWith(request);
    expect(vi.mocked(verifyJwt)).not.toHaveBeenCalled();
    expect(vi.mocked(verifyTenant)).not.toHaveBeenCalled();
  });

  it('routes to verifyJwt + verifyTenant when header is absent', async () => {
    const request = buildRequest();

    await verifyPunchDeviceTokenOrJwt(request);

    expect(vi.mocked(verifyPunchDeviceToken)).not.toHaveBeenCalled();
    expect(vi.mocked(verifyJwt)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(verifyTenant)).toHaveBeenCalledTimes(1);
  });

  it('propagates UnauthorizedError from verifyJwt when JWT is invalid and no device header is supplied', async () => {
    vi.mocked(verifyJwt).mockRejectedValue(
      new UnauthorizedError('User not authorized'),
    );
    const request = buildRequest();

    await expect(verifyPunchDeviceTokenOrJwt(request)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(vi.mocked(verifyTenant)).not.toHaveBeenCalled();
  });

  it('propagates UnauthorizedError from verifyPunchDeviceToken when device token is invalid', async () => {
    vi.mocked(verifyPunchDeviceToken).mockRejectedValue(
      new UnauthorizedError('Invalid or revoked punch device token'),
    );
    const request = buildRequest('bad-token');

    await expect(verifyPunchDeviceTokenOrJwt(request)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(vi.mocked(verifyJwt)).not.toHaveBeenCalled();
  });
});
