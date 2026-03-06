/**
 * SMTP Diagnostic Script
 *
 * Tests email delivery to both internal (same domain) and external addresses.
 * Requires the server to be running and an email account to be configured.
 *
 * Usage:
 *   npx tsx scripts/smtp-diagnostic.ts
 *
 * Environment:
 *   API_URL  (default: http://localhost:3333)
 *   SMTP_DEBUG=true  (optional, enables full SMTP conversation logging on server)
 */

export {};

const API_URL = process.env.API_URL || 'http://localhost:3333';

// Test credentials (seed user)
const ADMIN_EMAIL = 'admin@teste.com';
const ADMIN_PASSWORD = 'Teste@123';

interface AuthResult {
  token: string;
  tenantId?: string;
}

async function authenticate(): Promise<AuthResult> {
  console.log('1. Autenticando...');
  const loginRes = await fetch(`${API_URL}/v1/auth/login/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login falhou: ${loginRes.status} ${await loginRes.text()}`);
  }

  const loginData = await loginRes.json();
  const initialToken = loginData.token;
  console.log('   Login OK');

  // List tenants
  const tenantsRes = await fetch(`${API_URL}/v1/auth/tenants`, {
    headers: { Authorization: `Bearer ${initialToken}` },
  });

  if (!tenantsRes.ok) {
    throw new Error(`List tenants falhou: ${tenantsRes.status}`);
  }

  const tenantsData = await tenantsRes.json();
  const tenants = tenantsData.tenants ?? tenantsData.data ?? [];

  if (tenants.length === 0) {
    throw new Error('Nenhum tenant encontrado');
  }

  const tenantId = tenants[0].tenantId ?? tenants[0].id;
  console.log(`   Tenant: ${tenants[0].name ?? tenantId}`);

  // Select tenant
  const selectRes = await fetch(`${API_URL}/v1/auth/select-tenant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${initialToken}`,
    },
    body: JSON.stringify({ tenantId }),
  });

  if (!selectRes.ok) {
    throw new Error(`Select tenant falhou: ${selectRes.status}`);
  }

  const selectData = await selectRes.json();
  const token = selectData.token;
  console.log('   Tenant selecionado OK\n');

  return { token, tenantId };
}

async function listAccounts(token: string): Promise<Array<{ id: string; address: string; displayName: string | null }>> {
  const res = await fetch(`${API_URL}/v1/email/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`List accounts falhou: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.data ?? [];
}

async function sendTestEmail(
  token: string,
  accountId: string,
  to: string,
  label: string,
): Promise<{ success: boolean; messageId?: string; error?: string; status: number }> {
  const timestamp = new Date().toISOString();
  const subject = `[SMTP Diagnostic] ${label} - ${timestamp}`;
  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Teste de Diagnostico SMTP</h2>
      <p><strong>Tipo:</strong> ${label}</p>
      <p><strong>Data/Hora:</strong> ${timestamp}</p>
      <p><strong>Destino:</strong> ${to}</p>
      <hr>
      <p style="color: #666;">Este email foi enviado pelo script de diagnostico do OpenSea.</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_URL}/v1/email/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        accountId,
        to: [to],
        subject,
        bodyHtml,
      }),
    });

    const body = await res.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(body); } catch { /* not JSON */ }

    if (res.ok) {
      return {
        success: true,
        messageId: data.messageId as string,
        status: res.status,
      };
    } else {
      return {
        success: false,
        error: (data.message as string) || body,
        status: res.status,
      };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      status: 0,
    };
  }
}

async function main() {
  console.log('=== SMTP Diagnostic ===\n');
  console.log(`API: ${API_URL}\n`);

  const { token } = await authenticate();

  console.log('2. Listando contas de email...');
  const accounts = await listAccounts(token);

  if (accounts.length === 0) {
    console.log('   ERRO: Nenhuma conta de email configurada!');
    console.log('   Configure uma conta em /email/settings primeiro.\n');
    process.exit(1);
  }

  console.log(`   ${accounts.length} conta(s) encontrada(s):`);
  accounts.forEach((acc, i) => {
    console.log(`   [${i}] ${acc.address} (${acc.displayName ?? 'sem nome'})`);
  });

  const account = accounts[0];
  console.log(`\n   Usando: ${account.address}\n`);

  // Test 1: Send to same domain
  const sameDomain = account.address.split('@')[1];
  const internalTo = account.address; // Send to self
  console.log(`3. Teste 1: Envio interno (${internalTo})...`);
  const result1 = await sendTestEmail(token, account.id, internalTo, 'Envio Interno');

  if (result1.success) {
    console.log(`   OK - Status: ${result1.status}, MessageId: ${result1.messageId}`);
  } else {
    console.log(`   FALHOU - Status: ${result1.status}, Erro: ${result1.error}`);
  }

  // Test 2: Send to external (Gmail)
  const externalTo = 'guilhermeganim@gmail.com';
  console.log(`\n4. Teste 2: Envio externo Gmail (${externalTo})...`);
  const result2 = await sendTestEmail(token, account.id, externalTo, 'Envio Externo Gmail');

  if (result2.success) {
    console.log(`   OK - Status: ${result2.status}, MessageId: ${result2.messageId}`);
  } else {
    console.log(`   FALHOU - Status: ${result2.status}, Erro: ${result2.error}`);
  }

  // Test 3: Send to external (Hotmail)
  const hotmailTo = 'guilhermeganim@hotmail.com';
  console.log(`\n5. Teste 3: Envio externo Hotmail (${hotmailTo})...`);
  const result3 = await sendTestEmail(token, account.id, hotmailTo, 'Envio Externo Hotmail');

  if (result3.success) {
    console.log(`   OK - Status: ${result3.status}, MessageId: ${result3.messageId}`);
  } else {
    console.log(`   FALHOU - Status: ${result3.status}, Erro: ${result3.error}`);
  }

  // Summary
  console.log('\n=== Resumo ===');
  console.log(`Interno (${sameDomain}): ${result1.success ? 'OK' : 'FALHOU'}`);
  console.log(`Gmail:                   ${result2.success ? 'OK' : 'FALHOU'}`);
  console.log(`Hotmail:                 ${result3.success ? 'OK' : 'FALHOU'}`);

  if (result2.success && result3.success) {
    console.log('\nTodos os envios retornaram 202 (aceito pelo SMTP).');
    console.log('Verifique a caixa de entrada (e spam) dos destinos em alguns minutos.');
    console.log('\nPara ver a conversa SMTP completa, rode o servidor com SMTP_DEBUG=true');
  } else {
    console.log('\nAlguns envios falharam. Verifique os logs do servidor para mais detalhes.');
  }

  console.log('\n=== Fim ===');
}

main().catch((err) => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
