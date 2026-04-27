/**
 * Phase 11 / Plan 11-02 — CreateWebhookEndpointUseCase spec.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dns/anti-ssrf flow: mock NODE_ENV per test
vi.mock('node:dns', () => ({
  promises: {
    lookup: vi.fn(async (host: string) => {
      // localhost in tests resolves to 127.0.0.1 (private)
      if (host === 'localhost' || host === '10.0.0.1') {
        return [{ address: '127.0.0.1', family: 4 }];
      }
      return [{ address: '203.0.113.5', family: 4 }];
    }),
  },
}));

import { InMemoryWebhookEndpointsRepository } from '@/repositories/system/in-memory/in-memory-webhook-endpoints-repository';

import {
  CreateWebhookEndpointUseCase,
  TENANT_WEBHOOK_CAP,
  TenantWebhookCapReachedError,
} from './create-webhook-endpoint';

describe('CreateWebhookEndpointUseCase', () => {
  let repo: InMemoryWebhookEndpointsRepository;
  let useCase: CreateWebhookEndpointUseCase;
  const TENANT_A = 'tenant-a';

  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  beforeEach(() => {
    repo = new InMemoryWebhookEndpointsRepository();
    useCase = new CreateWebhookEndpointUseCase(repo);
  });

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  it('cria webhook tenant-scoped + secret 32 bytes random base64url + last4 + retorna secret cleartext UMA VEZ (D-08)', async () => {
    process.env.NODE_ENV = 'test';
    const result = await useCase.execute({
      tenantId: TENANT_A,
      url: 'https://api.example.com/hook',
      subscribedEvents: ['punch.time-entry.created'],
    });

    expect(result.secret.startsWith('whsec_')).toBe(true);
    expect(result.secret.length).toBeGreaterThan(40);
    expect(result.endpoint.tenantId).toBe(TENANT_A);
    expect(result.endpoint.secretMasked).toMatch(/^whsec_••••••••.{4}$/);
    expect(repo.items.length).toBe(1);
    expect(repo.items[0].secretCurrent).toBe(result.secret);
    expect(repo.items[0].secretCurrentLast4).toBe(result.secret.slice(-4));
  });

  it('valida URL: rejeita http:// em prod (D-31)', async () => {
    process.env.NODE_ENV = 'production';
    await expect(
      useCase.execute({
        tenantId: TENANT_A,
        url: 'http://api.example.com/hook',
        subscribedEvents: ['punch.time-entry.created'],
      }),
    ).rejects.toThrow(/https/i);
  });

  it('valida URL: rejeita IP privado direto (10.x, 127.x) em prod (D-31)', async () => {
    process.env.NODE_ENV = 'production';
    await expect(
      useCase.execute({
        tenantId: TENANT_A,
        url: 'https://10.0.0.1/hook',
        subscribedEvents: ['punch.time-entry.created'],
      }),
    ).rejects.toThrow(/private|loopback/i);
  });

  it('rejeita criação quando tenant atinge cap 50 webhooks (D-34)', async () => {
    process.env.NODE_ENV = 'test';
    // Pre-populate cap
    for (let i = 0; i < TENANT_WEBHOOK_CAP; i++) {
      await useCase.execute({
        tenantId: TENANT_A,
        url: `https://api.example.com/hook-${i}`,
        subscribedEvents: ['punch.time-entry.created'],
      });
    }
    await expect(
      useCase.execute({
        tenantId: TENANT_A,
        url: 'https://api.example.com/hook-overflow',
        subscribedEvents: ['punch.time-entry.created'],
      }),
    ).rejects.toBeInstanceOf(TenantWebhookCapReachedError);
  });
});
