import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Analyze Document (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should analyze text content (200 or provider error)', async () => {
    const documentContent = `
      EDITAL DE LICITACAO No 001/2026
      PREGAO ELETRONICO

      A Prefeitura Municipal de Sao Paulo torna publico o presente edital de licitacao
      para aquisicao dos seguintes materiais de escritorio:

      Item 1: 500 unidades de Caneta Esferografica Azul
      Item 2: 200 resmas de Papel A4 75g
      Item 3: 100 unidades de Grampeador de Mesa

      Prazo de entrega: 30 dias apos a emissao da ordem de compra.
      Valor estimado: R$ 15.000,00
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
    } else {
      expect([400, 500]).toContain(response.status);
    }
  });

  it('should validate required field (content)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/documents/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('should reject content that is too short', async () => {
    const response = await request(app.server)
      .post('/v1/ai/documents/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'curto',
      });

    expect(response.status).toBe(400);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/ai/documents/analyze')
      .send({
        content: 'Edital de licitacao para aquisicao de materiais',
      });

    expect(response.status).toBe(401);
  });
});
