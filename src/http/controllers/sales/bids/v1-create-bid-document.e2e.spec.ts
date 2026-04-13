import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';

describe('Create Bid Document (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/bid-documents')
      .send({});

    expect(response.status).toBe(401);
  });

  it('should create a bid document (201)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();
    const fakeFileId = randomUUID();

    // Create a bid first
    const createBidRes = await request(app.server)
      .post('/v1/bids')
      .set('Authorization', `Bearer ${token}`)
      .send({
        portalName: `ComprasGov-${ts}`,
        editalNumber: `EDITAL-DOC-${ts}`,
        modality: 'PREGAO_ELETRONICO',
        criterionType: 'MENOR_PRECO',
        legalFramework: 'LEI_14133_2021',
        object: `Objeto com documento ${ts}`,
        organName: `Orgao ${ts}`,
        openingDate: new Date().toISOString(),
      });

    const bidId = createBidRes.body.bid.id;

    const response = await request(app.server)
      .post('/v1/bid-documents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bidId,
        type: 'CERTIDAO_FEDERAL',
        name: `Certidao Federal ${ts}`,
        fileId: fakeFileId,
        issueDate: new Date().toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body.document).toBeDefined();
    expect(response.body.document.id).toBeDefined();
    expect(response.body.document.type).toBe('CERTIDAO_FEDERAL');
    expect(response.body.document.name).toContain('Certidao Federal');
  });
});
