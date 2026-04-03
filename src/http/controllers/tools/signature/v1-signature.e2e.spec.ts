import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Digital Signature (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });


  // ─── Certificates ──────────────────────────────────────────────────

  it('POST /v1/signature/certificates should upload a certificate (201)', async () => {
    const response = await request(app.server)
      .post('/v1/signature/certificates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Certificado A1 - Empresa Demo',
        type: 'A1',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('certificate');
    expect(response.body.certificate).toHaveProperty('id');
    expect(response.body.certificate.name).toBe(
      'Certificado A1 - Empresa Demo',
    );
    expect(response.body.certificate.type).toBe('A1');
  });

  it('GET /v1/signature/certificates should list certificates (200)', async () => {
    const response = await request(app.server)
      .get('/v1/signature/certificates')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('certificates');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.certificates)).toBe(true);
  });

  // ─── Envelopes ─────────────────────────────────────────────────────

  it('POST /v1/signature/envelopes should create an envelope (201)', async () => {
    const response = await request(app.server)
      .post('/v1/signature/envelopes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Contrato de Prestacao de Servicos',
        signatureLevel: 'ADVANCED',
        documentFileId: randomUUID(),
        documentHash: 'sha256-abc123def456',
        sourceModule: 'sales',
        sourceEntityType: 'contract',
        sourceEntityId: randomUUID(),
        routingType: 'SEQUENTIAL',
        signers: [
          {
            externalName: 'Joao da Silva',
            externalEmail: 'joao@example.com',
            order: 0,
            group: 0,
            role: 'SIGNER',
            signatureLevel: 'ADVANCED',
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('envelope');
    expect(response.body.envelope).toHaveProperty('id');
    expect(response.body.envelope.title).toBe(
      'Contrato de Prestacao de Servicos',
    );
    expect(response.body.envelope.sourceModule).toBe('sales');
  });

  it('GET /v1/signature/envelopes should list envelopes (200)', async () => {
    const response = await request(app.server)
      .get('/v1/signature/envelopes')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('envelopes');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.envelopes)).toBe(true);
  });

  // ─── Templates ─────────────────────────────────────────────────────

  it('POST /v1/signature/templates should create a template (201)', async () => {
    const response = await request(app.server)
      .post('/v1/signature/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Modelo Contrato Padrao',
        signatureLevel: 'ADVANCED',
        routingType: 'SEQUENTIAL',
        signerSlots: [
          { role: 'SIGNER', order: 0, group: 0 },
          { role: 'WITNESS', order: 1, group: 0 },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('template');
    expect(response.body.template).toHaveProperty('id');
    expect(response.body.template.name).toBe('Modelo Contrato Padrao');
    expect(response.body.template.signatureLevel).toBe('ADVANCED');
  });

  it('GET /v1/signature/templates should list templates (200)', async () => {
    const response = await request(app.server)
      .get('/v1/signature/templates')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('templates');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.templates)).toBe(true);
  });
});
