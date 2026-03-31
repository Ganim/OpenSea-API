# Banking Integration — O que falta para produção

**Data:** 2026-03-31
**Status:** 11/11 tasks implementadas, 49 testes passando, 0 erros TS

## O que funciona AGORA

- SicoobProvider completo (auth mTLS, saldo, extrato, boleto V3 híbrido, PIX, TED, webhook)
- PaymentOrder com fluxo de aprovação (analista cria → diretor aprova → sistema executa)
- Boleto/PIX use cases (emit, cancel, get, charge)
- 12 controllers com rotas registradas
- Frontend: page de ordens, setup modal, boleto/PIX modals
- 49 testes passando

## 1. Infraestrutura (bloqueante)

| Item | Por quê | Esforço |
|------|---------|---------|
| Conta no Sicoob Developers | Sem client_id + certificado = nada funciona | Cadastro manual no portal |
| Certificado digital A1 | mTLS exige `.pem` + `.key` emitidos pelo Sicoob | Solicitação ao gerente |
| Endpoint de webhook público | Sicoob precisa de URL HTTPS pública para notificações | Deploy + DNS + SSL |
| `npx prisma db push` em produção | Novos models não existem no banco de prod | 1 comando |

## 2. Backend (endpoints faltantes)

| Item | Detalhe |
|------|--------|
| **PATCH `/bank-accounts/:id/api-config`** | Salvar credenciais API (apiProvider, clientId, scopes, apiEnabled, autoEmitBoleto, autoLowThreshold). O frontend BankApiSetupModal chama esse endpoint. |
| **GET `/bank-accounts/:id/balance`** | Botão "Testar Conexão" do modal. Instancia provider e chama getBalance(). |
| **Upload de certificado via Storage** | certLoader atual lê do filesystem. Integrar com Storage module (S3): upload via frontend, download via storageService.getFileBuffer(). |
| **Cron job de sync** | A cada 4h: sincronizar saldo + transações das contas com apiEnabled. Precisa de scheduler. |
| **Listagem real de BankConnections** | A page /finance/bank-connections tem queryFn retornando []. Precisa de controller real. |
| **Seed de permissões** | Rodar `npx prisma db seed` para sincronizar PAYMENT_ORDERS e BOLETO. |
| **Factories usando shared helper** | 6 factories têm getBankingProvider duplicado. Migrar para usar getBankingProviderForAccount() de src/services/banking/get-banking-provider.ts. |

## 3. Frontend (integrações)

| Item | Detalhe |
|------|--------|
| Botão "Pagar via Banco" no Payable detail | Page /finance/payable/[id] já tem botão mas precisa abrir PaymentOrderModal |
| Botão "Gerar Boleto" no Receivable detail | Integrar BoletoEmitModal na page de detalhe |
| Notificações de aprovação | Quando PaymentOrder é criado, diretor deveria receber notificação |
| Comprovante PDF | receiptData salvo como JSON, falta gerador PDF (pdfkit) |

## 4. Validação com API real

| Item | Risco |
|------|-------|
| Nomes de campos | codigoBarras, linhaDigitavel, nossoNumero — podem ser diferentes na API real |
| Sandbox vs Produção | URL base pode ser diferente (sandbox.sicoob.com.br vs api.sicoob.com.br) |
| Rate limits | Limites de requisição desconhecidos, pode precisar de throttling |

## Ordem recomendada

1. Cadastrar no Sicoob Developers + obter certificado A1
2. Criar os 2 endpoints faltantes (PATCH api-config + GET balance)
3. Rodar seed de permissões
4. Testar no sandbox do Sicoob com dados reais
5. Ajustar nomes de campos conforme resposta real
6. Deploy com webhook URL pública
7. Configurar cron de sync de extrato

## Commits (NÃO pushados)

### OpenSea-API
- Schema: PaymentOrder, BankWebhookEvent, BankAccount API fields
- Interface + Factory + Pluggy adaptado
- SicoobProvider (auth + read + boleto + PIX + TED + webhook)
- PaymentOrder use cases (create, approve, reject, list, get)
- Boleto/PIX use cases (emit, cancel, get, charge)
- Webhook processing (auto-settlement + threshold)
- 12 HTTP controllers + routes
- Reviewer fixes (mTLS, agent caching, balance, tenant-scoped update)
- Shared getBankingProviderForAccount helper
- Spec + Plan docs

### OpenSea-APP
- Payment orders page + types + service + hooks
- BankApiSetupModal (4 seções)
- BoletoEmitModal + PixEmitModal
- boleto-pix.service
- Bank account detail API tab
- Dashboard card "Ordens de Pagamento"
- TS fixes (BANK_PAYMENT_METHOD_LABELS, Header props)
