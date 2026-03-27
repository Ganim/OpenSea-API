import type { DocEntry } from '../../docs-registry';

export const financeDocs: DocEntry[] = [
  // ================================================================
  // 1. OVERVIEW
  // ================================================================
  {
    module: 'finance',
    feature: 'overview',
    type: 'overview',
    keywords: [
      'financeiro',
      'finance',
      'contas',
      'pagamentos',
      'recebimentos',
      'fluxo de caixa',
      'modulo financeiro',
    ],
    requiredPermissions: ['finance.entries.access'],
    title: 'Visao Geral do Modulo Financeiro',
    content: `O Modulo Financeiro do OpenSea centraliza toda a gestao de contas a pagar e a receber da empresa. Ele oferece controle completo sobre lancamentos financeiros, contas bancarias, centros de custo, emprestimos, consorcios, conciliacao bancaria e operacoes de pagamento.

**Principais funcionalidades:**

- **Lancamentos (Entries):** Registro de contas a pagar (PAYABLE) e a receber (RECEIVABLE) com status automatico (PENDING, PAID, OVERDUE, CANCELLED, PARTIALLY_PAID). Suporte a pagamento parcial, cancelamento, operacoes em lote e recorrencia.
- **Contas Bancarias:** Cadastro de contas correntes, poupanca, investimento e caixa, com acompanhamento de saldo e vinculacao a lancamentos.
- **Centros de Custo:** Alocacao de despesas por area ou departamento, com orcamento definido e acompanhamento de realizacao.
- **Conciliacao Bancaria:** Importacao de extratos OFX, match automatico e manual com lancamentos, e finalizacao de conciliacoes.
- **PIX e Boleto:** Geracao de cobranças PIX (QR Code) e boletos registrados via integracao Efi, com leitura automatica de codigos.
- **Emprestimos e Consorcios:** Controle de parcelas, taxas de juros e contemplacao.
- **Dashboard Inteligente:** Painel com posicao de caixa, KPIs, heatmap de vencidos, obrigacoes semanais e alertas de anomalias.
- **Regras de Aprovacao:** Fluxos de aprovacao configuráveis para lancamentos acima de determinados valores.
- **Escalacoes de Atraso:** Configuracao de alertas automaticos para lancamentos vencidos.
- **Orcamentos:** Planejamento orcamentario por periodo e comparacao orcado vs realizado.

**Navegacao principal:** O dashboard financeiro fica em /finance. As entidades estao acessiveis via menu lateral: Contas a Pagar (/finance/payable), Contas a Receber (/finance/receivable), Contas Bancarias (/finance/bank-accounts), Centros de Custo (/finance/cost-centers), Emprestimos (/finance/loans), Consorcios (/finance/consortia), Contratos (/finance/contracts), Recorrencias (/finance/recurring), Categorias (/finance/categories). Areas operacionais: Conciliacao (/finance/reconciliation), Relatorios (/finance/reports), Configuracoes (/finance/settings).

Todos os valores monetarios sao armazenados em centavos (inteiro). Por exemplo, R$ 150,00 e representado como 15000.`,
  },

  // ================================================================
  // 2. GUIDE: Create Entry
  // ================================================================
  {
    module: 'finance',
    feature: 'entries',
    type: 'guide',
    keywords: [
      'lancamento',
      'conta a pagar',
      'conta a receber',
      'criar',
      'cadastrar',
      'despesa',
      'receita',
      'novo lancamento',
      'registrar',
    ],
    requiredPermissions: ['finance.entries.register'],
    navPath: '/finance/payable/new',
    title: 'Como Criar um Lancamento Financeiro',
    content: `Para criar um novo lancamento financeiro no OpenSea, siga os passos abaixo:

**1. Escolha o tipo de lancamento:**
- **Conta a Pagar (PAYABLE):** Acesse /finance/payable e clique em "Novo Lancamento", ou use o botao "Lancamento Rapido" no dashboard financeiro.
- **Conta a Receber (RECEIVABLE):** Acesse /finance/receivable e clique em "Novo Lancamento".

**2. Preencha os campos obrigatorios:**
- **Descricao:** Texto livre que identifica o lancamento (ex: "Pagamento fornecedor Textil SA").
- **Valor:** Informe o valor em reais. O sistema converte automaticamente para centavos.
- **Data de Vencimento:** Selecione a data em que o pagamento ou recebimento vence.

**3. Campos opcionais (recomendados):**
- **Categoria:** Selecione uma categoria existente (ex: Folha de Pagamento, Material, Aluguel) para classificacao.
- **Conta Bancaria:** Vincule a uma conta bancaria para controle de saldo.
- **Centro de Custo:** Associe a um centro de custo para analise departamental.
- **Tags:** Adicione etiquetas livres para facilitar buscas e filtros.
- **Recorrencia:** Configure repeticao automatica (diaria, semanal, mensal, anual) para despesas fixas.

**4. Confirmacao:**
O lancamento e criado com status PENDING. A partir deste ponto, voce pode:
- Registrar pagamentos parciais ou totais (status muda para PARTIALLY_PAID ou PAID).
- Cancelar o lancamento (status muda para CANCELLED).
- Gerar boleto ou cobranca PIX para lancamentos a receber.

**Criacao em lote:** Use o endpoint POST /v1/finance/entries/batch para criar multiplos lancamentos de uma vez. Util para importacao de folha de pagamento (POST /v1/finance/entries/import-payroll) ou digitalizacao via OCR.

**Lancamento Rapido:** No dashboard financeiro (/finance), o botao "Lancamento Rapido" abre um modal simplificado para registro agil sem sair da tela principal.

**Permissao necessaria:** finance.entries.register`,
  },

  // ================================================================
  // 3. GUIDE: Manage Bank Accounts
  // ================================================================
  {
    module: 'finance',
    feature: 'bank-accounts',
    type: 'guide',
    keywords: [
      'conta bancaria',
      'banco',
      'saldo',
      'extrato',
      'conta corrente',
      'poupanca',
      'caixa',
    ],
    requiredPermissions: ['finance.bank_accounts.register'],
    navPath: '/finance/bank-accounts',
    title: 'Como Gerenciar Contas Bancarias',
    content: `O modulo de Contas Bancarias permite cadastrar e gerenciar todas as contas da empresa, acompanhar saldos e vincular lancamentos.

**Acessando:** Navegue para /finance/bank-accounts para ver a listagem de todas as contas cadastradas.

**Cadastrar nova conta:**
1. Clique em "Nova Conta Bancaria".
2. Preencha os campos:
   - **Nome (obrigatorio):** Identificador da conta (ex: "Conta Principal Itau").
   - **Banco:** Nome da instituicao financeira.
   - **Tipo:** Selecione entre Conta Corrente (CHECKING), Poupanca (SAVINGS), Investimento (INVESTMENT) ou Caixa (CASH).
   - **Saldo Inicial:** Informe o saldo atual em reais. O sistema converte para centavos internamente.
3. Salve. A conta aparecera na listagem.

**Editar conta:** Acesse /finance/bank-accounts/[id] para visualizar detalhes. Clique em "Editar" para alterar nome, banco ou tipo.

**Excluir conta:** Na listagem ou na pagina de detalhe, utilize a opcao "Excluir". A exclusao exige confirmacao por PIN de acao. Contas com lancamentos vinculados nao podem ser excluidas diretamente.

**Saldo e movimentacao:**
O saldo da conta e atualizado automaticamente conforme lancamentos sao pagos ou recebidos e vinculados a ela. No dashboard financeiro (/finance), o banner "Posicao de Caixa" mostra o saldo consolidado de todas as contas.

**Conexao bancaria (Open Finance):**
O sistema suporta conexao direta com bancos via Pluggy (Open Finance). Acesse /finance/bank-connections para conectar uma conta e sincronizar transacoes automaticamente (POST /v1/finance/bank-connections/sync).

**Endpoints disponiveis:**
- GET /v1/finance/bank-accounts — Listar contas
- GET /v1/finance/bank-accounts/:id — Detalhe de uma conta
- POST /v1/finance/bank-accounts — Criar conta
- PUT /v1/finance/bank-accounts/:id — Atualizar conta
- DELETE /v1/finance/bank-accounts/:id — Excluir conta

**Permissao necessaria:** finance.bank_accounts.register (criacao), finance.bank_accounts.access (visualizacao)`,
  },

  // ================================================================
  // 4. GUIDE: Cost Centers
  // ================================================================
  {
    module: 'finance',
    feature: 'cost-centers',
    type: 'guide',
    keywords: [
      'centro de custo',
      'departamento',
      'rateio',
      'alocacao',
      'orcamento',
      'custo',
    ],
    requiredPermissions: ['finance.cost_centers.register'],
    navPath: '/finance/cost-centers',
    title: 'Como Configurar Centros de Custo',
    content: `Centros de Custo permitem classificar e distribuir despesas por area, departamento ou projeto, facilitando a analise de gastos e o controle orcamentario.

**Acessando:** Navegue para /finance/cost-centers para visualizar todos os centros de custo cadastrados.

**Cadastrar novo centro de custo:**
1. Clique em "Novo Centro de Custo" ou acesse /finance/cost-centers/new.
2. Preencha os campos:
   - **Nome (obrigatorio):** Nome do centro de custo (ex: "Marketing", "TI", "Producao").
   - **Codigo:** Codigo alfanumerico opcional para referencia rapida (ex: "MKT-001").
   - **Orcamento:** Valor orcado para o periodo em reais. Util para comparacao orcado vs realizado.
3. Salve. O centro de custo estara disponivel para vinculacao em lancamentos.

**Vincular a lancamentos:**
Ao criar ou editar um lancamento financeiro, selecione o centro de custo no campo correspondente. Isso permite filtrar e agrupar lancamentos por area.

**Analise orcamentaria:**
O sistema oferece comparacao de orcamento planejado vs realizado. Acesse /finance/reports/budget para visualizar o painel de orcamentos com detalhamento por centro de custo. O endpoint GET /v1/finance/budgets/vs-actual retorna os dados de comparacao.

**Editar e excluir:**
- Acesse /finance/cost-centers/[id] para visualizar detalhes.
- Utilize "Editar" para alterar nome, codigo ou orcamento.
- "Excluir" requer confirmacao por PIN de acao. Centros de custo com lancamentos vinculados nao podem ser removidos.

**Endpoints disponiveis:**
- GET /v1/finance/cost-centers — Listar centros de custo
- GET /v1/finance/cost-centers/:id — Detalhe
- POST /v1/finance/cost-centers — Criar
- PUT /v1/finance/cost-centers/:id — Atualizar
- DELETE /v1/finance/cost-centers/:id — Excluir

**Permissao necessaria:** finance.cost_centers.register (criacao), finance.cost_centers.access (visualizacao)`,
  },

  // ================================================================
  // 5. GUIDE: PIX Operations
  // ================================================================
  {
    module: 'finance',
    feature: 'pix',
    type: 'guide',
    keywords: [
      'pix',
      'transferencia',
      'qr code',
      'chave pix',
      'pagamento instantaneo',
      'cobranca pix',
    ],
    requiredPermissions: ['finance.entries.register'],
    navPath: '/finance/receivable',
    title: 'Como Realizar Operacoes PIX',
    content: `O OpenSea integra com a API Efi (antigo Gerencianet) para operacoes PIX, permitindo gerar cobranças e realizar pagamentos instantaneos diretamente a partir de lancamentos financeiros.

**Gerar cobranca PIX (Conta a Receber):**
1. Acesse um lancamento a receber existente (status PENDING) em /finance/receivable/[id].
2. Clique em "Gerar PIX" ou utilize o endpoint POST /v1/finance/entries/:id/pix-charge.
3. O sistema gera automaticamente:
   - **QR Code:** Imagem para pagamento via aplicativo bancario.
   - **Chave copia-e-cola:** Texto para pagamento manual.
   - **Data de expiracao:** Configuravel no momento da geracao.
   - **Transaction ID (txId):** Identificador unico da transacao.
4. O valor da cobranca e obtido automaticamente do lancamento vinculado.

**Pagar via PIX (Conta a Pagar):**
1. Acesse um lancamento a pagar existente em /finance/payable/[id].
2. Utilize a opcao "Pagar via PIX" ou o endpoint POST /v1/finance/entries/:id/pay-via-pix.
3. O sistema processa o pagamento e atualiza o status do lancamento automaticamente.

**Leitura automatica de PIX:**
O sistema possui um parser de codigos PIX (POST /v1/finance/entries/parse-pix) que extrai automaticamente os dados de um codigo PIX colado, identificando valor, chave e beneficiario.

**Requisitos de integracao:**
- Credenciais Efi configuradas no tenant (Client ID, Client Secret, certificado).
- Chave PIX cadastrada na conta Efi.
- Acesse /finance/settings para configurar as credenciais.

**Acompanhamento:**
Todas as operacoes PIX sao registradas no log de auditoria. O status do lancamento e atualizado automaticamente quando o pagamento e confirmado.

**Permissao necessaria:** finance.entries.register (gerar cobranca), finance.entries.modify (pagar via PIX)`,
  },

  // ================================================================
  // 6. GUIDE: Boleto Generation
  // ================================================================
  {
    module: 'finance',
    feature: 'boleto',
    type: 'guide',
    keywords: [
      'boleto',
      'cobranca',
      'vencimento',
      'emissao',
      'boleto registrado',
      'codigo de barras',
      'linha digitavel',
    ],
    requiredPermissions: ['finance.entries.register'],
    navPath: '/finance/receivable',
    title: 'Como Gerar Boletos de Cobranca',
    content: `O OpenSea permite gerar boletos bancarios registrados para lancamentos a receber, integrado com a API Efi (antigo Gerencianet).

**Gerar boleto para um lancamento:**
1. Acesse um lancamento a receber (RECEIVABLE) com status PENDING em /finance/receivable/[id].
2. Clique em "Gerar Boleto" ou utilize o endpoint POST /v1/finance/entries/:id/boleto.
3. Informe os dados obrigatorios:
   - **CPF/CNPJ do cliente:** Documento do pagador (11 ou 14 digitos, com ou sem formatacao).
4. Dados opcionais:
   - **Instrucoes:** Ate 4 linhas de instrucoes impressas no boleto (maximo 100 caracteres cada).
5. O sistema retorna:
   - **Codigo de barras:** 44 digitos para leitura em caixa eletronico.
   - **Linha digitavel:** 47 digitos formatados para digitacao manual.
   - **URL do PDF:** Link para download do boleto em formato PDF.
   - **Data de vencimento:** Obtida automaticamente do lancamento.
   - **Valor:** Obtido automaticamente do lancamento (em centavos).
   - **ID da cobranca Efi:** Identificador para rastreamento.

**Leitura automatica de boleto:**
O sistema possui um parser de boletos (POST /v1/finance/entries/parse-boleto) que extrai dados de um codigo de barras ou linha digitavel colados, identificando banco, valor, vencimento e beneficiario. Util para cadastrar rapidamente contas a pagar a partir de boletos recebidos.

**Requisitos:**
- Integracao Efi configurada com credenciais validas.
- Lancamento deve ser do tipo RECEIVABLE e estar com status PENDING.
- CPF/CNPJ do cliente e obrigatorio para emissao do boleto registrado.

**Rastreamento:**
Todas as emissoes de boleto sao registradas no log de auditoria com o codigo do lancamento e ID da cobranca.

**Permissao necessaria:** finance.entries.modify (gerar boleto para lancamento existente)`,
  },

  // ================================================================
  // 7. TROUBLESHOOTING: Entry Not Reconciling
  // ================================================================
  {
    module: 'finance',
    feature: 'reconciliation',
    type: 'troubleshooting',
    keywords: [
      'conciliacao',
      'nao bate',
      'divergencia',
      'saldo',
      'extrato',
      'ofx',
      'conciliar',
      'match',
    ],
    requiredPermissions: ['finance.entries.access'],
    navPath: '/finance/reconciliation',
    title: 'Lancamento Nao Concilia com Extrato',
    content: `Se um lancamento financeiro nao esta conciliando automaticamente com o extrato bancario importado, verifique os pontos abaixo:

**1. Valor divergente:**
A conciliacao automatica compara o valor do lancamento com o valor da transacao no extrato. Divergencias de centavos impedem o match. Verifique se o valor do lancamento corresponde exatamente ao valor no extrato (ambos em centavos). Taxas bancarias, juros ou descontos podem causar diferenca.

**2. Data incompativel:**
O sistema busca correspondencias considerando a data de vencimento do lancamento e a data da transacao no extrato. Se as datas estao muito distantes, o match automatico pode nao ocorrer.

**3. Lancamento ja conciliado ou cancelado:**
Lancamentos com status PAID, CANCELLED ou ja vinculados a outra conciliacao nao aparecem como candidatos. Verifique o status do lancamento em /finance/payable/[id] ou /finance/receivable/[id].

**4. Extrato nao importado:**
Certifique-se de que o extrato OFX foi importado corretamente. Acesse /finance/reconciliation e verifique se a conciliacao aparece na lista. Use POST /v1/finance/reconciliation/import-ofx para importar.

**5. Conta bancaria incorreta:**
A conciliacao vincula transacoes a uma conta bancaria especifica. Se o lancamento esta associado a uma conta diferente, nao havera correspondencia.

**Solucao — Match manual:**
Se o match automatico falhou, use o match manual:
1. Acesse /finance/reconciliation/[id] para ver os itens pendentes.
2. Selecione um item do extrato e um lancamento correspondente.
3. Confirme o vinculo via POST /v1/finance/reconciliation/:id/items/:itemId/match.

**Criar lancamento a partir do extrato:**
Se nao existe um lancamento correspondente, crie um diretamente a partir do item do extrato usando POST /v1/finance/reconciliation/:id/items/:itemId/create-entry.

**Ignorar item:**
Itens do extrato irrelevantes (tarifas, estornos internos) podem ser ignorados via POST /v1/finance/reconciliation/:id/items/:itemId/ignore.

**Finalizar conciliacao:**
Apos resolver todos os itens pendentes, finalize em POST /v1/finance/reconciliation/:id/complete.`,
  },

  // ================================================================
  // 8. TROUBLESHOOTING: Overdue Entries
  // ================================================================
  {
    module: 'finance',
    feature: 'overdue',
    type: 'troubleshooting',
    keywords: [
      'vencido',
      'atrasado',
      'inadimplencia',
      'cobranca',
      'overdue',
      'atraso',
      'pendente',
    ],
    requiredPermissions: ['finance.entries.access'],
    navPath: '/finance/overview/overdue',
    title: 'Lancamentos Vencidos e Inadimplencia',
    content: `Lancamentos vencidos (OVERDUE) sao aqueles cuja data de vencimento ja passou e que ainda estao com status PENDING. O sistema detecta e marca automaticamente esses lancamentos.

**Como identificar lancamentos vencidos:**
1. No dashboard financeiro (/finance), o heatmap de vencidos mostra a distribuicao por periodo.
2. Acesse /finance/overview/overdue para a lista completa de lancamentos vencidos.
3. Utilize filtros na listagem de contas a pagar (/finance/payable) ou a receber (/finance/receivable) para exibir apenas status OVERDUE.
4. O endpoint GET /v1/finance/entries/check-overdue retorna lancamentos vencidos programaticamente.

**Verificacao automatica:**
O sistema possui um processo de verificacao de vencimentos (check-overdue) que pode ser executado periodicamente. Ele identifica lancamentos PENDING com dueDate anterior a data atual e atualiza o status para OVERDUE.

**Escalacoes de atraso:**
Configure regras de escalacao automatica em /finance/escalations para que o sistema notifique responsaveis quando lancamentos ultrapassarem determinados prazos de atraso. As escalacoes permitem definir niveis (ex: 7 dias, 15 dias, 30 dias) com acoes diferentes em cada nivel.

Endpoints de escalacao:
- POST /v1/finance/escalations — Criar regra de escalacao
- GET /v1/finance/escalations — Listar regras
- PUT /v1/finance/escalations/:id — Atualizar regra
- DELETE /v1/finance/escalations/:id — Excluir regra

**Acoes para resolver inadimplencia:**
- **Registrar pagamento:** Use POST /v1/finance/entries/:id/payments para dar baixa total ou parcial.
- **Gerar nova cobranca:** Emita boleto ou PIX atualizado para o cliente devedor.
- **Cancelar:** Se o lancamento nao sera mais cobrado, cancele via POST /v1/finance/entries/:id/cancel.
- **Operacoes em lote:** Para multiplos lancamentos vencidos, use as operacoes bulk: PUT /v1/finance/entries/bulk-pay, POST /v1/finance/entries/bulk-cancel.

**KPIs no dashboard:**
O dashboard financeiro exibe indicadores de inadimplencia, incluindo total vencido, quantidade de lancamentos e aging (envelhecimento por faixa de atraso).`,
  },

  // ================================================================
  // 9. TROUBLESHOOTING: Payment Errors
  // ================================================================
  {
    module: 'finance',
    feature: 'payments',
    type: 'troubleshooting',
    keywords: [
      'pagamento',
      'erro',
      'falha',
      'rejeicao',
      'estorno',
      'baixa',
      'pagar',
      'registrar pagamento',
    ],
    requiredPermissions: ['finance.entries.modify'],
    navPath: '/finance/payable',
    title: 'Erros em Pagamentos e Recebimentos',
    content: `Se voce encontrou erros ao registrar pagamentos ou recebimentos, verifique as causas mais comuns abaixo:

**1. "Lancamento ja finalizado nao pode ser alterado":**
Lancamentos com status PAID ou CANCELLED sao imutaveis. Nao e possivel registrar novos pagamentos, editar ou cancelar. Verifique o status atual do lancamento antes de tentar a operacao.

**2. "Valor do pagamento excede o saldo restante":**
Ao registrar um pagamento parcial, o valor informado nao pode exceder o saldo devedor do lancamento. Verifique o valor ja pago e o restante pendente na pagina de detalhe do lancamento.

**3. Erro ao gerar boleto — "Entry must be RECEIVABLE":**
Boletos so podem ser gerados para lancamentos do tipo RECEIVABLE (contas a receber). Verifique se o lancamento selecionado e do tipo correto.

**4. Erro ao gerar PIX — "Credenciais nao configuradas":**
A integracao PIX requer credenciais Efi validas. Acesse /finance/settings e verifique se Client ID, Client Secret e certificado estao configurados. Consulte o administrador do tenant se necessario.

**5. Pagamento parcial nao atualiza status:**
Quando um pagamento parcial e registrado, o status do lancamento muda automaticamente para PARTIALLY_PAID. Se o pagamento cobre o valor total, o status muda para PAID. Verifique se o valor informado esta correto (em centavos no backend, em reais na interface).

**6. Erro 403 — Permissao insuficiente:**
O registro de pagamentos requer a permissao finance.entries.admin. Verifique com o administrador se seu perfil possui essa permissao. A geracao de boleto e PIX requer finance.entries.modify.

**7. Pagamento em lote com falhas parciais:**
Ao usar operacoes bulk (PUT /v1/finance/entries/bulk-pay), o sistema processa cada lancamento individualmente. Se algum falhar (ex: ja pago, cancelado), os demais continuam. O retorno indica quais tiveram sucesso e quais falharam.

**Pagamento dividido (Split):**
Para dividir um pagamento entre multiplos metodos (ex: parte PIX, parte boleto), use POST /v1/finance/entries/:id/split-payment, informando os valores e metodos de cada parcela.

**Registro de baixa manual:**
Acesse o lancamento em /finance/payable/[id] ou /finance/receivable/[id] e clique em "Registrar Pagamento". Informe o valor pago, data do pagamento e metodo utilizado.`,
  },

  // ================================================================
  // 10. LIMITATIONS
  // ================================================================
  {
    module: 'finance',
    feature: 'limitations',
    type: 'limitation',
    keywords: [
      'limitacao',
      'restricao',
      'nao suporta',
      'nao e possivel',
      'limite',
    ],
    requiredPermissions: ['finance.entries.access'],
    title: 'Limitacoes do Modulo Financeiro',
    content: `O Modulo Financeiro do OpenSea possui as seguintes limitacoes conhecidas:

**1. Moeda unica por lancamento:**
Cada lancamento e registrado em uma unica moeda (BRL por padrao). Operacoes em moeda estrangeira requerem conversao manual ou uso do endpoint de cotacoes (GET /v1/finance/exchange-rates) para consulta. Nao ha suporte nativo a lancamentos multi-moeda em um unico registro.

**2. Integracao PIX e Boleto dependem de provedor externo:**
As funcionalidades de PIX e boleto registrado dependem da integracao com Efi (Gerencianet). Se o provedor estiver indisponivel ou as credenciais expirarem, essas operacoes ficarao inoperantes. O sistema registra erros mas nao possui fallback automatico para outro provedor.

**3. Conciliacao bancaria limitada a OFX:**
A importacao de extratos atualmente suporta apenas o formato OFX. Formatos como CSV, CNAB 240/400 ou PDF nao sao importados automaticamente. Para esses casos, os lancamentos devem ser criados manualmente ou via API.

**4. Lancamentos finalizados sao imutaveis:**
Lancamentos com status PAID ou CANCELLED nao podem ser editados, reabertos ou revertidos pelo sistema. Para corrigir um lancamento pago incorretamente, e necessario cancelar (se ainda PENDING/OVERDUE) e criar um novo, ou registrar um lancamento de estorno manualmente.

**5. Rateio por centro de custo e simples:**
Cada lancamento aceita apenas um centro de custo. Nao ha suporte nativo a rateio proporcional entre multiplos centros de custo em um unico lancamento. Para distribucao, e necessario criar lancamentos separados.

**6. Recorrencia nao retroativa:**
Ao configurar recorrencia em um lancamento, as parcelas futuras sao geradas a partir da data atual. O sistema nao cria lancamentos retroativos para periodos anteriores.

**7. Limite de operacoes em lote:**
As operacoes bulk (pagamento, cancelamento, exclusao, categorizacao em lote) processam cada item individualmente. Em volumes muito grandes (acima de 500 itens), o tempo de processamento pode ser elevado. Recomenda-se dividir em lotes menores.

**8. NF-e em fase de integracao:**
A emissao de Nota Fiscal Eletronica (NF-e) a partir de lancamentos (POST /v1/finance/entries/:id/emit-nfe) depende de integracao com provedor fiscal externo e pode nao estar disponivel em todos os tenants.`,
  },
];
