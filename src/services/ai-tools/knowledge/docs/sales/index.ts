import { DocEntry } from '../../docs-registry';

export const salesDocs: DocEntry[] = [
  {
    module: 'sales',
    feature: 'visao-geral',
    type: 'overview',
    keywords: [
      'vendas',
      'comercial',
      'pedidos',
      'clientes',
      'crm',
      'pipeline',
      'orcamentos',
      'promocoes',
    ],
    requiredPermissions: ['sales.customers.access'],
    navPath: '/sales',
    title: 'Visao Geral do Modulo de Vendas',
    content: `O modulo de Vendas do OpenSea oferece gestao completa do ciclo comercial, desde a captacao de leads ate o fechamento de pedidos e pos-venda.

Principais funcionalidades:
- **Clientes**: Cadastro detalhado com dados pessoais/empresariais, contatos, enderecos e historico de compras.
- **Contatos**: Gerenciamento de pessoas de contato vinculadas a clientes (decisores, compradores, tecnicos).
- **Negociacoes (Deals)**: Acompanhamento de oportunidades comerciais com valor estimado, probabilidade de fechamento e responsavel.
- **Pipelines**: Funis de venda personalizaveis com estagios (ex: Prospeccao, Qualificacao, Proposta, Negociacao, Fechamento).
- **Orcamentos (Quotes)**: Criacao de propostas comerciais com itens, quantidades, precos e condicoes de pagamento. Conversao direta em pedido.
- **Pedidos (Orders)**: Registro de vendas com status (rascunho, confirmado, aprovado, em separacao, enviado, entregue, cancelado).
- **Promocoes**: Regras de desconto por produto, categoria, periodo ou volume de compra.
- **Reservas de Itens**: Bloqueio temporario de estoque para pedidos em andamento.
- **Tabelas de Preco**: Definicao de precos diferenciados por grupo de clientes ou canal de venda.
- **Condicoes de Pagamento**: Configuracao de parcelamentos, prazos e formas de pagamento aceitas.
- **Comissoes**: Calculo automatico de comissoes por vendedor com base em regras configuradas.
- **Devolucoes**: Processo de devolucao de mercadorias com motivo e reposicao ou credito.
- **Loja Virtual (POS)**: Ponto de venda para operacoes de balcao ou loja fisica.
- **Campanhas e Landing Pages**: Ferramentas de marketing para captacao de leads e conversao.

Navegacao: Acesse pelo menu lateral em "Vendas". A pagina principal exibe cards organizados por categoria para cada sub-modulo.`,
  },
  {
    module: 'sales',
    feature: 'cadastro-cliente',
    type: 'guide',
    keywords: [
      'cliente',
      'cadastrar',
      'novo',
      'criar',
      'pessoa',
      'empresa',
      'cpf',
      'cnpj',
    ],
    requiredPermissions: ['sales.customers.register'],
    navPath: '/sales/customers',
    title: 'Guia: Cadastrar Cliente',
    content: `Para cadastrar um novo cliente no sistema, siga os passos abaixo:

1. **Acesse Vendas > Clientes** pelo menu lateral.
2. **Clique em "Novo Cliente"** no canto superior direito da listagem.
3. **Tipo de cliente**: Selecione Pessoa Fisica (PF) ou Pessoa Juridica (PJ).
4. **Dados principais**:
   - PF: Nome completo, CPF, data de nascimento, sexo.
   - PJ: Razao social, nome fantasia, CNPJ, inscricao estadual, inscricao municipal.
5. **Contato**: Email principal, telefone fixo, celular, WhatsApp.
6. **Endereco**: CEP (busca automatica), logradouro, numero, complemento, bairro, cidade, estado. E possivel cadastrar multiplos enderecos (entrega, cobranca, correspondencia).
7. **Dados comerciais** (opcional):
   - Tabela de preco vinculada (para precos diferenciados).
   - Condicao de pagamento padrao.
   - Vendedor responsavel.
   - Limite de credito.
8. **Observacoes** (opcional): Anotacoes internas sobre o cliente.
9. **Salve o cadastro**.

Apos o cadastro, o cliente fica disponivel para selecao em orcamentos, pedidos e negociacoes.

**Dicas:**
- O CPF/CNPJ e validado em tempo real. Duplicatas no mesmo tenant sao impedidas.
- Use os filtros da listagem (nome, documento, cidade, vendedor) para localizar clientes rapidamente.
- O historico de compras e atualizado automaticamente conforme pedidos sao registrados.
- Contatos adicionais podem ser vinculados na aba de contatos do cadastro do cliente.`,
  },
  {
    module: 'sales',
    feature: 'criar-pedido',
    type: 'guide',
    keywords: [
      'pedido',
      'venda',
      'criar',
      'novo',
      'order',
      'itens',
      'confirmar',
      'aprovar',
    ],
    requiredPermissions: ['sales.orders.register'],
    navPath: '/sales/orders',
    title: 'Guia: Criar Pedido de Venda',
    content: `O pedido de venda registra uma transacao comercial com o cliente. Siga os passos para criar um novo pedido:

1. **Acesse Vendas > Pedidos** pelo menu lateral.
2. **Clique em "Novo Pedido"**.
3. **Selecione o cliente**: Busque por nome, CPF/CNPJ ou codigo. Se o cliente nao existe, cadastre-o primeiro.
4. **Adicione itens ao pedido**:
   - Busque produtos pelo nome ou codigo de barras.
   - Informe a quantidade desejada.
   - O preco unitario e preenchido automaticamente conforme a tabela de preco do cliente (ou tabela padrao).
   - Aplique descontos por item se necessario.
5. **Condicao de pagamento**: Selecione a forma de pagamento (a vista, parcelado, boleto, cartao, PIX).
6. **Endereco de entrega**: Selecione um dos enderecos cadastrados do cliente ou informe um novo.
7. **Observacoes**: Adicione notas internas ou instrucoes de entrega.
8. **Salve como rascunho** ou **confirme o pedido**.

**Ciclo de vida do pedido:**
- **Rascunho**: Pode ser editado livremente.
- **Confirmado**: Reserva o estoque (se configurado) e gera lancamentos financeiros. Requer permissao "sales.orders.confirm".
- **Aprovado**: Liberado para separacao e envio. Requer permissao "sales.orders.approve".
- **Cancelado**: Libera reservas de estoque e estorna lancamentos. Requer permissao "sales.orders.cancel".

**A partir de orcamento:** Orcamentos aprovados podem ser convertidos diretamente em pedidos, trazendo todos os itens e condicoes automaticamente.

**Importante:** Ao confirmar, o sistema verifica o saldo de estoque. Se algum item estiver indisponivel, o pedido permanece em rascunho com alerta.`,
  },
  {
    module: 'sales',
    feature: 'promocoes',
    type: 'guide',
    keywords: [
      'promocao',
      'desconto',
      'campanha',
      'oferta',
      'preco',
      'regra',
      'cupom',
    ],
    requiredPermissions: ['sales.promotions.access'],
    navPath: '/sales/variant-promotions',
    title: 'Guia: Gerenciar Promocoes',
    content: `O modulo de Promocoes permite criar regras de desconto que sao aplicadas automaticamente em pedidos e orcamentos.

**Tipos de promocao:**
- **Desconto por produto/variante**: Percentual ou valor fixo de desconto em produtos especificos.
- **Regras de desconto**: Condicoes mais complexas baseadas em volume, categoria, periodo ou combinacao de itens.
- **Cupons**: Codigos promocionais que os clientes podem aplicar no momento da compra.
- **Tabelas de preco especiais**: Precos diferenciados por grupo de clientes (ex: atacado, varejo, funcionarios).

**Criar uma promocao de variante:**
1. Acesse Vendas > Promocoes de Variantes.
2. Clique em "Nova Promocao".
3. Selecione o produto e a variante que recebera o desconto.
4. Defina o tipo de desconto (percentual ou valor fixo).
5. Informe o valor do desconto.
6. Configure o periodo de vigencia (data inicio e fim).
7. Opcionalmente, defina quantidade minima para ativacao.
8. Salve.

**Criar uma regra de desconto:**
1. Acesse Vendas > Regras de Desconto.
2. Configure as condicoes (ex: compre 3 leve 4, desconto progressivo por volume).
3. Defina a prioridade (regras com maior prioridade sao aplicadas primeiro).
4. Ative a regra.

**Importante:**
- Promocoes ativas sao aplicadas automaticamente ao adicionar itens em pedidos.
- Multiplas promocoes podem ser acumulativas ou exclusivas conforme configuracao.
- O historico de promocoes utilizadas fica registrado no pedido para auditoria.`,
  },
  {
    module: 'sales',
    feature: 'reservas',
    type: 'guide',
    keywords: [
      'reserva',
      'estoque',
      'bloquear',
      'item',
      'disponibilidade',
      'liberar',
    ],
    requiredPermissions: ['sales.orders.access'],
    navPath: '/sales/item-reservations',
    title: 'Guia: Fluxo de Reservas de Itens',
    content: `As Reservas de Itens permitem bloquear temporariamente unidades do estoque para pedidos em andamento, garantindo a disponibilidade ate a conclusao da venda.

**Como funciona:**
1. Ao confirmar um pedido, o sistema cria automaticamente reservas para cada item, decrementando o saldo disponivel (sem alterar o saldo fisico).
2. A reserva permanece ativa enquanto o pedido estiver nos status "Confirmado" ou "Aprovado".
3. Ao finalizar o pedido (entrega concluida), as reservas sao convertidas em movimentacoes de saida no estoque.
4. Se o pedido for cancelado, as reservas sao liberadas e o saldo disponivel retorna ao valor original.

**Criar reserva manualmente:**
1. Acesse Vendas > Reservas de Itens.
2. Clique em "Nova Reserva".
3. Selecione o produto e a quantidade a reservar.
4. Informe o motivo (ex: pedido pendente de aprovacao, separacao para cliente VIP).
5. Defina a data de expiracao (apos a qual a reserva sera liberada automaticamente).
6. Salve.

**Liberar reserva:**
- Na listagem de reservas, selecione a reserva e clique em "Liberar". A liberacao devolve as unidades ao saldo disponivel.

**Monitoramento:**
- A listagem exibe todas as reservas ativas com produto, quantidade, pedido vinculado, data de criacao e expiracao.
- Use filtros por produto, status ou periodo para localizar reservas especificas.

**Importante:**
- Reservas expiradas sao liberadas automaticamente pelo sistema.
- O saldo disponivel (estoque fisico menos reservas) e exibido em tempo real na tela de produtos do modulo de Estoque.`,
  },
  {
    module: 'sales',
    feature: 'pedido-travado',
    type: 'troubleshooting',
    keywords: [
      'pedido',
      'travado',
      'nao confirma',
      'erro',
      'status',
      'bloqueado',
      'rascunho',
    ],
    requiredPermissions: ['sales.orders.access'],
    navPath: '/sales/orders',
    title: 'Solucao de Problemas: Pedido Travado',
    content: `Se um pedido nao avanca de status ou apresenta erros ao confirmar/aprovar, verifique os pontos abaixo.

**Problema: Pedido nao sai do status "Rascunho"**
1. **Estoque insuficiente**: Verifique se todos os itens do pedido possuem saldo disponivel no estoque. Acesse Estoque > Produtos e confira o saldo de cada item.
2. **Permissao**: A confirmacao requer a permissao "sales.orders.confirm". Verifique com o administrador se sua funcao possui essa permissao.
3. **Campos obrigatorios**: Confira se todos os campos obrigatorios estao preenchidos (cliente, ao menos um item, condicao de pagamento).
4. **Cliente inativo**: Clientes com status inativo nao podem receber novos pedidos. Reative o cliente antes.

**Problema: Pedido confirmado mas nao avanca para "Aprovado"**
- A aprovacao e uma etapa opcional que pode exigir um nivel hierarquico superior. Verifique:
  1. Se ha uma regra de aprovacao configurada (ex: pedidos acima de determinado valor requerem aprovacao do gerente).
  2. Se o usuario aprovador possui a permissao "sales.orders.approve".

**Problema: Pedido nao pode ser cancelado**
- Pedidos com status "Entregue" ou "Faturado" nao podem ser cancelados diretamente. Utilize o processo de devolucao (Vendas > Devolucoes) para estornar a operacao.
- O cancelamento requer a permissao "sales.orders.cancel".

**Problema: Pedido duplicado**
- Se um pedido foi criado em duplicidade, cancele o pedido indesejado (isso libera as reservas de estoque) e mantenha apenas o correto.

**Se o problema persistir:** Verifique os logs de auditoria (Auditoria > Logs) filtrando pelo numero do pedido para identificar a acao que causou o bloqueio.`,
  },
  {
    module: 'sales',
    feature: 'divergencia-preco',
    type: 'troubleshooting',
    keywords: [
      'preco',
      'errado',
      'diferente',
      'tabela',
      'valor',
      'desconto',
      'divergencia',
    ],
    requiredPermissions: ['sales.orders.access'],
    navPath: '/sales/orders',
    title: 'Solucao de Problemas: Divergencia de Preco',
    content: `Se os precos exibidos em pedidos ou orcamentos nao correspondem ao esperado, verifique as possiveis causas.

**Causa 1: Tabela de preco incorreta**
- Cada cliente pode ter uma tabela de preco vinculada. Se o preco esta diferente do esperado:
  1. Acesse Vendas > Clientes > [cliente] > Editar.
  2. Verifique qual tabela de preco esta vinculada.
  3. Acesse Vendas > Tabelas de Preco e confira os valores da tabela selecionada.
  4. Se nenhuma tabela especifica esta vinculada, o sistema utiliza a tabela padrao.

**Causa 2: Promocao ativa**
- Promocoes de variante ou regras de desconto ativas podem alterar o preco automaticamente.
  1. Acesse Vendas > Promocoes de Variantes e verifique se ha promocoes vigentes para o produto em questao.
  2. Acesse Vendas > Regras de Desconto e verifique regras que possam se aplicar.
  3. Desative a promocao se o desconto nao deveria ser aplicado.

**Causa 3: Preco do produto atualizado**
- Se o preco base do produto foi alterado recentemente no modulo de Estoque, pedidos ja criados mantem o preco do momento da inclusao. Novos pedidos utilizarao o preco atualizado.
- Solucao: Para atualizar o preco em um pedido existente (em rascunho), remova o item e adicione-o novamente.

**Causa 4: Preco personalizado por cliente**
- Precos individuais podem ser configurados em Vendas > Precos por Cliente. Esses precos tem prioridade sobre tabelas de preco e precos base.

**Dica:** O historico de alteracoes de preco e registrado no modulo de Auditoria. Consulte os logs para rastrear quando e por quem o preco foi modificado.`,
  },
  {
    module: 'sales',
    feature: 'limitacoes',
    type: 'limitation',
    keywords: [
      'limitacao',
      'restricao',
      'nao suporta',
      'limite',
      'vendas',
      'comercial',
    ],
    requiredPermissions: ['sales.customers.access'],
    navPath: '/sales',
    title: 'Limitacoes do Modulo de Vendas',
    content: `Limitacoes conhecidas do modulo de Vendas:

**Integracao com Marketplaces:**
- A integracao com Mercado Livre e Shopee esta disponivel, porem em versao inicial. A sincronizacao de pedidos e produtos pode apresentar atraso de ate 15 minutos dependendo do volume.
- Outros marketplaces (Amazon, Magazine Luiza, B2W) ainda nao sao suportados nativamente.

**Nota Fiscal Eletronica (NF-e):**
- A emissao de NF-e depende de integracao com servicos externos (Sefaz). O sistema prepara os dados do documento mas a transmissao requer configuracao de certificado digital A1 e credenciais do ambiente de producao/homologacao.

**Ponto de Venda (POS):**
- O modulo de caixa/POS esta em desenvolvimento. Funcionalidades como leitura de codigo de barras via camera, integracao com impressora fiscal e TEF (transferencia eletronica de fundos) serao adicionadas em versoes futuras.

**Orcamentos:**
- Orcamentos expirados nao sao removidos automaticamente. O vendedor deve cancelar manualmente orcamentos que nao foram convertidos.
- A conversao de orcamento para pedido nao permite edicao dos itens durante a conversao (edite antes de converter ou apos criar o pedido).

**Comissoes:**
- O calculo de comissoes opera apenas sobre pedidos finalizados (status "Entregue"). Pedidos cancelados ou devolvidos tem a comissao estornada automaticamente.
- Nao ha suporte para comissoes escalonadas (percentuais diferentes conforme faixa de valor).

**Volume de dados:**
- Relatorios de vendas com periodo superior a 12 meses podem apresentar lentidao. Recomenda-se filtrar por periodos menores para melhor desempenho.
- Listagens utilizam scroll infinito e carregam lotes de ate 100 registros por vez.`,
  },
];
