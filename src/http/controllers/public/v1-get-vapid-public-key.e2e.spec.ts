import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';

/**
 * Phase 8 / Plan 08-01 — A1 resolution.
 * Endpoint: GET /v1/public/vapid-key
 *
 * Sem auth, sem rate-limit. Retorna 200 + publicKey quando configurada,
 * 503 quando ausente.
 */
describe('GET /v1/public/vapid-key (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 200 com publicKey quando VAPID_PUBLIC_KEY está configurado, ou 503 quando ausente', async () => {
    const response = await request(app.server).get('/v1/public/vapid-key');

    if (process.env.VAPID_PUBLIC_KEY) {
      expect(response.status).toBe(200);
      expect(response.body.publicKey).toBe(process.env.VAPID_PUBLIC_KEY);
      expect(typeof response.body.publicKey).toBe('string');
      expect(response.body.publicKey.length).toBeGreaterThan(0);
    } else {
      expect(response.status).toBe(503);
      expect(response.body.message).toMatch(/VAPID not configured/i);
    }
  });

  it('rota é pública (sem Authorization header retorna 200/503, nunca 401)', async () => {
    const response = await request(app.server).get('/v1/public/vapid-key');

    expect([200, 503]).toContain(response.status);
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });
});
