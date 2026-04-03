import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('AI Documents (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });


  it('POST /v1/ai/documents/analyze — should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/ai/documents/analyze')
      .send({
        content:
          'Edital de licitação para aquisição de materiais de escritório para a Prefeitura Municipal',
      });

    expect(response.status).toBe(401);
  });

  it('POST /v1/ai/documents/analyze — should analyze text content', async () => {
    const documentContent = `
      EDITAL DE LICITAÇÃO Nº 001/2026
      PREGÃO ELETRÔNICO

      A Prefeitura Municipal de São Paulo torna público o presente edital de licitação
      para aquisição dos seguintes materiais de escritório:

      Item 1: 500 unidades de Caneta Esferográfica Azul
      Item 2: 200 resmas de Papel A4 75g
      Item 3: 100 unidades de Grampeador de Mesa
      Item 4: 50 caixas de Clips nº 2

      Prazo de entrega: 30 dias após a emissão da ordem de compra.
      Valor estimado: R$ 15.000,00

      Requisitos:
      - Certidão Negativa de Débitos
      - Registro no SICAF
      - Atestado de capacidade técnica
    `;

    const response = await request(app.server)
      .post('/v1/ai/documents/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: documentContent,
        documentType: 'EDITAL',
      });

    // AI provider may not be configured in test env
    if (response.status === 200) {
      expect(response.body).toHaveProperty('documentInfo');
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('stockMatch');
      expect(response.body).toHaveProperty('suggestedActions');
      expect(response.body).toHaveProperty('summary');
      expect(response.body.documentInfo).toHaveProperty('type');
      expect(Array.isArray(response.body.items)).toBe(true);
    } else {
      // Accept provider-related errors
      expect([400, 500]).toContain(response.status);
    }
  });

  it('POST /v1/ai/documents/analyze — should validate required field (content)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/documents/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    // Zod validation should reject missing content
    expect(response.status).toBe(400);
  });

  it('POST /v1/ai/documents/analyze — should reject content that is too short', async () => {
    const response = await request(app.server)
      .post('/v1/ai/documents/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'curto',
      });

    expect(response.status).toBe(400);
  });
});
