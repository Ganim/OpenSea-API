import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createBankAccount } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

const VALID_OFX_CONTENT = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS><CODE>0<SEVERITY>INFO</STATUS>
<DTSERVER>20260301120000
<LANGUAGE>POR
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1001
<STATUS><CODE>0<SEVERITY>INFO</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>001
<ACCTID>123456
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20260301
<DTEND>20260315
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260305120000
<TRNAMT>-150.00
<FITID>2026030500001
<MEMO>PIX ENVIADO - FORNECEDOR ABC
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260310120000
<TRNAMT>500.00
<FITID>2026031000001
<MEMO>TED RECEBIDO - CLIENTE XYZ
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

describe('Import OFX Reconciliation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should import an OFX file and create reconciliation', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const bankAccount = await createBankAccount(tenantId);

    const response = await request(app.server)
      .post('/v1/finance/reconciliation/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(VALID_OFX_CONTENT), 'extrato.ofx')
      .field('bankAccountId', bankAccount.id);

    expect(response.status).toBe(201);
    expect(response.body.reconciliation).toEqual(
      expect.objectContaining({
        totalTransactions: 2,
        status: 'IN_PROGRESS',
        fileName: 'extrato.ofx',
      }),
    );
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/finance/reconciliation/import',
    );

    expect(response.status).toBe(401);
  });
});
