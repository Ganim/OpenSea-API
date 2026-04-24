import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.hoisted pattern (Plan 04-05 convention): garante que os mocks são
// registrados ANTES do import do módulo sob teste.
const mocks = vi.hoisted(() => ({
  jwtVerify: vi.fn(),
  getJwtSecret: vi.fn(() => 'test-secret'),
}));

vi.mock('jsonwebtoken', () => ({
  default: { verify: mocks.jwtVerify },
  verify: mocks.jwtVerify,
}));

vi.mock('@/config/jwt', () => ({
  getJwtSecret: mocks.getJwtSecret,
  jwtConfig: {
    algorithm: 'HS256' as const,
    issuer: 'opensea-api',
    audience: 'opensea-client',
  },
  isUsingRS256: () => false,
}));

import { verifyActionPin } from './verify-action-pin';

function mockReply() {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return reply;
}

describe('verifyActionPin middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getJwtSecret.mockReturnValue('test-secret');
  });

  it('responde 403 quando o header x-action-pin-token está ausente', async () => {
    const reply = mockReply();
    const request = {
      headers: {},
      user: { sub: 'U1' },
    } as never;
    await verifyActionPin(request, reply as never);
    expect(reply.status).toHaveBeenCalledWith(403);
    expect(mocks.jwtVerify).not.toHaveBeenCalled();
  });

  it('responde 403 quando o token é inválido (jwt.verify throws)', async () => {
    mocks.jwtVerify.mockImplementationOnce(() => {
      throw new Error('invalid signature');
    });
    const reply = mockReply();
    const request = {
      headers: { 'x-action-pin-token': 'bad' },
      user: { sub: 'U1' },
    } as never;
    await verifyActionPin(request, reply as never);
    expect(reply.status).toHaveBeenCalledWith(403);
  });

  it('responde 403 quando scope !== "action-pin"', async () => {
    mocks.jwtVerify.mockReturnValueOnce({
      scope: 'other',
      sub: 'U1',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    const reply = mockReply();
    const request = {
      headers: { 'x-action-pin-token': 't' },
      user: { sub: 'U1' },
    } as never;
    await verifyActionPin(request, reply as never);
    expect(reply.status).toHaveBeenCalledWith(403);
  });

  it('responde 403 quando decoded.sub !== request.user.sub (token de outro usuário)', async () => {
    mocks.jwtVerify.mockReturnValueOnce({
      scope: 'action-pin',
      sub: 'OTHER',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    const reply = mockReply();
    const request = {
      headers: { 'x-action-pin-token': 't' },
      user: { sub: 'U1' },
    } as never;
    await verifyActionPin(request, reply as never);
    expect(reply.status).toHaveBeenCalledWith(403);
  });

  it('responde 403 quando iat > 10min atrás (PIN expirado)', async () => {
    mocks.jwtVerify.mockReturnValueOnce({
      scope: 'action-pin',
      sub: 'U1',
      iat: Math.floor(Date.now() / 1000) - 700, // 11min+ atrás
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    const reply = mockReply();
    const request = {
      headers: { 'x-action-pin-token': 't' },
      user: { sub: 'U1' },
    } as never;
    await verifyActionPin(request, reply as never);
    expect(reply.status).toHaveBeenCalledWith(403);
  });

  it('NÃO envia 403 quando o token é válido', async () => {
    mocks.jwtVerify.mockReturnValueOnce({
      scope: 'action-pin',
      sub: 'U1',
      iat: Math.floor(Date.now() / 1000) - 30, // 30s atrás
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    const reply = mockReply();
    const request = {
      headers: { 'x-action-pin-token': 'valid' },
      user: { sub: 'U1' },
    } as never;
    await verifyActionPin(request, reply as never);
    expect(reply.status).not.toHaveBeenCalledWith(403);
  });
});
