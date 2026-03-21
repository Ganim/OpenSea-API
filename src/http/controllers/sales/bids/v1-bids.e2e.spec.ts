import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Bids (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/bids should create a bid (201)', async () => {
    const response = await request(app.server)
      .post('/v1/bids')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Pregao Eletronico 001/2026',
        modality: 'PREGAO_ELETRONICO',
        agency: 'Prefeitura Municipal de Teste',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('bid');
    expect(response.body.bid).toHaveProperty('id');
    expect(response.body.bid.title).toBe('Pregao Eletronico 001/2026');
  });

  it('GET /v1/bids should list bids (200)', async () => {
    const response = await request(app.server)
      .get('/v1/bids')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bids');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.bids)).toBe(true);
  });

  it('GET /v1/bids/:id should get a bid by id (200)', async () => {
    // First create a bid to get its id
    const createResponse = await request(app.server)
      .post('/v1/bids')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Concorrencia 002/2026',
        modality: 'CONCORRENCIA',
        agency: 'Secretaria de Educacao',
      });

    const bidId = createResponse.body.bid.id;

    const response = await request(app.server)
      .get(`/v1/bids/${bidId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bid');
    expect(response.body.bid.id).toBe(bidId);
    expect(response.body.bid.title).toBe('Concorrencia 002/2026');
  });

  it('POST /v1/bid-documents should upload a bid document (201)', async () => {
    // First create a bid
    const createResponse = await request(app.server)
      .post('/v1/bids')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Pregao 003/2026',
        modality: 'PREGAO_PRESENCIAL',
        agency: 'Secretaria de Saude',
      });

    const bidId = createResponse.body.bid.id;

    const response = await request(app.server)
      .post('/v1/bid-documents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bidId,
        name: 'Edital Completo',
        type: 'EDITAL',
        fileUrl: 'https://example.com/docs/edital.pdf',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('document');
    expect(response.body.document).toHaveProperty('id');
    expect(response.body.document.name).toBe('Edital Completo');
  });

  it('GET /v1/bid-documents should list bid documents (200)', async () => {
    const response = await request(app.server)
      .get('/v1/bid-documents')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('documents');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.documents)).toBe(true);
  });
});
