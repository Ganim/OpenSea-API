import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { app } from '@/app';
import { getJwtSecret, isUsingRS256, jwtConfig } from '@/config/jwt';
import { prisma } from '@/lib/prisma';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

function issueActionPinToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const secret = getJwtSecret();
  const signKey = typeof secret === 'string' ? secret : secret.private;
  return jwt.sign(
    {
      scope: 'action-pin',
      sub: userId,
      iat: now,
    },
    signKey,
    {
      algorithm: isUsingRS256() ? 'RS256' : 'HS256',
      expiresIn: '60s',
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    },
  );
}

describe('Upload Punch Approval Evidence (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let approvalId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;
    const emp = await createEmployeeE2E({ tenantId });

    const te = await prisma.timeEntry.create({
      data: {
        tenantId,
        employeeId: emp.employeeId,
        entryType: 'CLOCK_IN',
        timestamp: new Date(),
      },
    });
    const approval = await prisma.punchApproval.create({
      data: {
        tenantId,
        timeEntryId: te.id,
        employeeId: emp.employeeId,
        reason: 'OUT_OF_GEOFENCE',
        details: { distance: 900 },
        status: 'PENDING',
      },
    });
    approvalId = approval.id;

    // Evita bater no S3 real no e2e — stub retorna estrutura UploadWithKeyResult.
    vi.spyOn(S3FileUploadService.prototype, 'uploadWithKey').mockResolvedValue({
      key: 'stub',
      bucket: 'stub',
      etag: 'stub-etag',
      size: 0,
    });
  });

  it('Upload PDF pequeno com PIN válido → 201 + storageKey', async () => {
    const pin = issueActionPinToken(userId);
    const pdfBytes = Buffer.from('%PDF-1.4 fake test body');

    const response = await request(app.server)
      .post(`/v1/hr/punch-approvals/${approvalId}/evidence`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-action-pin-token', pin)
      .attach('file', pdfBytes, {
        filename: 'atestado.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(201);
    expect(response.body.storageKey).toMatch(
      /^[^/]+\/punch-approvals\/[^/]+\/evidence\/[0-9a-f-]{36}\.pdf$/,
    );
    expect(response.body.size).toBe(pdfBytes.byteLength);
    expect(response.body.filename).toBe('atestado.pdf');
  });

  it('Upload de JPG com PIN válido → 400', async () => {
    const pin = issueActionPinToken(userId);
    const jpgBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

    const response = await request(app.server)
      .post(`/v1/hr/punch-approvals/${approvalId}/evidence`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-action-pin-token', pin)
      .attach('file', jpgBytes, {
        filename: 'foto.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(400);
    expect(response.body.message.toLowerCase()).toMatch(/pdf/);
  });

  it('Upload sem PIN → 403', async () => {
    const pdfBytes = Buffer.from('%PDF-1.4 fake');

    const response = await request(app.server)
      .post(`/v1/hr/punch-approvals/${approvalId}/evidence`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', pdfBytes, {
        filename: 'atestado.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(403);
  });

  it('Upload sem auth → 401', async () => {
    const pdfBytes = Buffer.from('%PDF-1.4 fake');

    const response = await request(app.server)
      .post(`/v1/hr/punch-approvals/${approvalId}/evidence`)
      .attach('file', pdfBytes, {
        filename: 'atestado.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(401);
  });
});
