import { DocEntry } from '../../docs-registry';

export const stockDocs: DocEntry[] = [
  // 1. Overview
  {
    module: 'stock',
    feature: 'overview',
    type: 'overview',
    keywords: ['estoque', 'stock', 'modulo', 'visao geral', 'inventario'],
    requiredPermissions: ['stock.products.access'],
    title: 'Visao Geral do Modulo de Estoque',
    content: `O Modulo de Estoque e o nucleo de gestao de inventario do OpenSea. Ele controla todo o ciclo de vida dos produtos, desde o cadastro ate a movimentacao fisica nos armazens.

**Entidades Principais:**
- **Templates**: Modelos base que definem a estrutura de atributos dos produtos. Todo produto obrigatoriamente pertence a um template.
- **Produtos**: Itens cadastrados com nome, descricao, status e codigo hierarquico (fullCode) gerado automaticamente no formato TEMPLATE.FABRICANTE.PRODUTO (ex: 001.001.0001).
- **Variantes**: SKUs especificos de um produto (cor, tamanho, etc.). Cada variante possui preco, custo, margem de lucro e codigos de barras proprios.
- **Itens**: Unidades fisicas individuais de uma variante. Cada item possui quantidade, status (AVAILABLE, RESERVED, IN_TRANSIT, DAMAGED, EXPIRED, DISPOSED), lote e data de validade.
- **Categorias**: Classificacao hierarquica para organizar produtos. Um produto pode pertencer a multiplas categorias.
- **Fabricantes**: Empresas que fabricam os produtos. Influenciam o codigo hierarquico do produto.
- **Fornecedores**: Empresas que fornecem os produtos para revenda.
- **Armazens (Warehouses)**: Locais fisicos de armazenamento, organizados em Zonas e Bins (posicoes individuais).
- **Pedidos de Compra (Purchase Orders)**: Solicitacoes de compra a fornecedores, com itens, quantidades e status de acompanhamento.
- **Volumes**: Agrupamentos de itens para expedicao ou transferencia entre locais.

**Fluxo Principal:**
1. Cadastre um Template com os atributos desejados.
2. Crie Categorias para organizar os produtos.
3. Cadastre Produtos vinculados ao template e categorias.
4. Adicione Variantes ao produto (cores, tamanhos).
5. Registre Itens (unidades fisicas) com entrada no estoque.
6. Configure Armazens, Zonas e Bins para localizacao fisica.
7. Movimente itens entre localizacoes conforme necessidade.

**Codigos de Barras:** Cada produto, variante e item recebe automaticamente codigos Code128, EAN-13 e UPC, gerados a partir do fullCode hierarquico. Isso garante rastreabilidade completa em toda a cadeia.`,
  },

  // 2. Guide: Create Product
  {
    module: 'stock',
    feature: 'create-product',
    type: 'guide',
    keywords: [
      'produto',
      'criar',
      'cadastrar',
      'novo',
      'adicionar',
      'registrar',
    ],
    requiredPermissions: ['stock.products.register'],
    navPath: 'Menu > Estoque > Produtos > Novo Produto',
    title: 'Como Criar um Produto',
    content: `**Pre-requisitos:** Antes de criar um produto, voce precisa ter pelo menos um Template e uma Categoria cadastrados no sistema.

**Passo a Passo:**

1. Acesse o menu **Estoque > Produtos**.
2. Clique no botao **"Novo Produto"** no canto superior direito.
3. Preencha os campos obrigatorios:
   - **Nome** (obrigatorio): Nome do produto. Deve ser unico dentro do tenant.
   - **Template** (obrigatorio): Selecione o template que define a estrutura de atributos do produto. Atencao: o template nao pode ser alterado apos a criacao.
4. Preencha os campos opcionais conforme necessidade:
   - **Descricao**: Texto livre para descrever o produto.
   - **Status**: DRAFT (rascunho), ACTIVE (ativo), INACTIVE (inativo) ou DISCONTINUED (descontinuado). Padrao: ACTIVE.
   - **Fornecedor**: Vinculo com o fornecedor principal.
   - **Fabricante**: Vinculo com o fabricante. Influencia o codigo hierarquico.
   - **Categorias**: Selecione uma ou mais categorias.
   - **Atributos**: Campos dinamicos definidos pelo template selecionado.
5. Clique em **Salvar**.

**Apos a criacao:**
- O sistema gera automaticamente o **fullCode** hierarquico (ex: 001.001.0001).
- Codigos de barras (Code128, EAN-13, UPC) sao gerados automaticamente.
- Um **slug** unico e criado a partir do nome.
- O produto aparecera na listagem com status inicial definido.

**Erros Comuns:**
- "Nome obrigatorio" — O campo nome nao pode ficar vazio.
- "Template obrigatorio" — Selecione um template antes de salvar.
- "Nome ja existe" — Ja existe um produto ativo com esse nome no tenant.

**Proximo Passo:** Apos criar o produto, adicione Variantes para definir SKUs especificos (cores, tamanhos) e depois registre Itens para controlar o estoque fisico.`,
  },

  // 3. Guide: Manage Variants
  {
    module: 'stock',
    feature: 'manage-variants',
    type: 'guide',
    keywords: ['variante', 'sku', 'cor', 'tamanho', 'grade'],
    requiredPermissions: ['stock.variants.register'],
    navPath: 'Menu > Estoque > Produtos > [Produto] > Variantes',
    title: 'Como Gerenciar Variantes de um Produto',
    content: `**O que sao Variantes?**
Variantes representam as diferentes versoes de um produto (SKUs). Por exemplo, uma camiseta pode ter variantes para cada combinacao de cor e tamanho: "Azul P", "Azul M", "Vermelha G".

**Como Adicionar uma Variante:**

1. Acesse o menu **Estoque > Produtos** e clique no produto desejado.
2. Na pagina de detalhes, acesse a aba **Variantes**.
3. Clique em **"Nova Variante"**.
4. Preencha os campos:
   - **Nome** (obrigatorio): Identificacao da variante (ex: "Azul Marinho - P").
   - **SKU**: Codigo SKU. Se nao informado, sera gerado automaticamente.
   - **Preco**: Preco de venda da variante. Padrao: R$ 0,00.
   - **Custo (costPrice)**: Preco de custo para calculo de margem.
   - **Margem de Lucro (profitMargin)**: Percentual de margem sobre o custo.
   - **Atributos**: Campos dinamicos herdados do template do produto.
5. Clique em **Salvar**.

**Codigos Automaticos:**
Cada variante recebe um **fullCode** hierarquico no formato TEMPLATE.FABRICANTE.PRODUTO.VARIANTE (ex: 001.001.0001.001), alem de codigos Code128, EAN-13 e UPC gerados automaticamente.

**Desativar Variante:**
Para desativar uma variante sem exclui-la, altere o campo **isActive** para falso. Variantes inativas nao aparecem em selecoes e pedidos, mas mantem o historico.

**Historico de Precos:**
Toda alteracao de preco de uma variante e registrada automaticamente no historico (VariantPriceHistory), permitindo rastrear evolucoes de preco ao longo do tempo.

**Imagens e Anexos:**
Variantes podem ter imagens proprias (VariantImage) e anexos (VariantAttachment) para fichas tecnicas, fotos de referencia e outros documentos.

**Codigos de Fornecedor:**
E possivel vincular codigos de referencia de fornecedores (VariantSupplierCode) para facilitar a identificacao em pedidos de compra.`,
  },

  // 4. Guide: Stock Movement
  {
    module: 'stock',
    feature: 'stock-movement',
    type: 'guide',
    keywords: ['entrada', 'saida', 'movimentacao', 'transferencia', 'estoque'],
    requiredPermissions: ['stock.items.register'],
    navPath: 'Menu > Estoque > Produtos > [Produto] > Itens',
    title: 'Como Fazer Movimentacoes de Estoque',
    content: `**Tipos de Movimentacao:**

O sistema suporta tres categorias de movimentacao de estoque:

**1. Entradas (aumentam o estoque):**
- **PURCHASE**: Entrada por compra de fornecedor. Campos: quantidade, custo unitario, numero do lote (opcional), data de validade (opcional).
- **CUSTOMER_RETURN**: Devolucao de cliente. Campos: quantidade, referencia do pedido original.

**2. Saidas (diminuem o estoque):**
- **SALE**: Saida por venda. Vinculada automaticamente ao pedido de venda.
- **PRODUCTION**: Consumo em producao.
- **SAMPLE**: Envio de amostra.
- **LOSS**: Perda ou extravio. Requer justificativa obrigatoria.
- **SUPPLIER_RETURN**: Devolucao ao fornecedor.

**3. Transferencias:**
- **TRANSFER**: Movimenta itens entre bins (posicoes) diferentes. Requer bin de origem e destino.
- **INVENTORY_ADJUSTMENT**: Ajuste de inventario apos contagem fisica.

**Como Registrar uma Movimentacao:**

1. Acesse o item desejado na pagina do produto.
2. Clique em **"Nova Movimentacao"**.
3. Selecione o **tipo** de movimentacao.
4. Informe a **quantidade** (ate 3 casas decimais).
5. Preencha os campos adicionais conforme o tipo:
   - **Notas**: Observacoes sobre a movimentacao.
   - **Referencia de Origem/Destino**: Identificacao da origem ou destino.
   - **Numero do Lote**: Para rastreabilidade.
6. Confirme a operacao.

**Fluxo de Status do Item:**
- AVAILABLE: Disponivel para venda ou movimentacao.
- RESERVED: Reservado para um pedido (nao pode ser movimentado).
- IN_TRANSIT: Em transito entre localizacoes.
- DAMAGED: Danificado, requer avaliacao.
- EXPIRED: Validade vencida.
- DISPOSED: Descartado permanentemente.

**Importante:** Toda movimentacao registra automaticamente o usuario responsavel, a quantidade antes e depois da operacao, e a data/hora exata. Esse historico e imutavel e garante rastreabilidade completa.`,
  },

  // 5. Guide: Warehouse Setup
  {
    module: 'stock',
    feature: 'warehouse-setup',
    type: 'guide',
    keywords: [
      'armazem',
      'deposito',
      'zona',
      'bin',
      'localizacao',
      'estante',
      'prateleira',
    ],
    requiredPermissions: ['stock.warehouses.register'],
    navPath: 'Menu > Estoque > Localizacoes',
    title: 'Como Configurar Armazens e Localizacoes',
    content: `**Hierarquia de Localizacoes:**
O sistema organiza o espaco fisico em tres niveis: **Armazem > Zona > Bin**.

**1. Criar um Armazem:**
1. Acesse **Estoque > Localizacoes**.
2. Clique em **"Novo Armazem"**.
3. Preencha:
   - **Codigo** (obrigatorio): 2 a 5 caracteres (ex: "FAB", "CD1", "LOJA").
   - **Nome** (obrigatorio): Nome descritivo (ex: "Fabrica Principal").
   - **Descricao**: Detalhes adicionais (opcional).
   - **Endereco**: Localizacao fisica do armazem (opcional).
4. Salve o armazem.

**2. Adicionar Zonas:**
1. Dentro do armazem, clique em **"Nova Zona"**.
2. Preencha:
   - **Codigo**: 2 a 5 caracteres (ex: "EST", "PRD", "EXP").
   - **Nome**: Nome descritivo (ex: "Estoque Geral").
   - **Estrutura**: Configure corredores (aisles), prateleiras (shelves) e posicoes (bins por prateleira). A estrutura e definida em formato JSON.
3. Salve a zona.

**3. Bins (Posicoes):**
Os bins sao **gerados automaticamente** a partir da estrutura da zona. Cada bin recebe um endereco unico no formato **ARMAZEM-ZONA-CORREDOR.PRATELEIRA-POSICAO** (ex: "FAB-EST-01.03-A").

Cada bin possui:
- **Endereco**: Gerado automaticamente, unico dentro do tenant.
- **Corredor (aisle)**: Numero do corredor (1-99).
- **Prateleira (shelf)**: Numero da prateleira (1-999).
- **Posicao (position)**: Identificador da posicao ("A", "B", "C" ou "1", "2", "3").
- **Capacidade**: Limite maximo de itens (opcional).
- **Ocupacao Atual**: Quantidade atual de itens no bin.

**Bloquear/Desbloquear Bins:**
Bins podem ser bloqueados temporariamente para manutencao ou reorganizacao. Bins bloqueados nao aceitam novas movimentacoes de entrada ou transferencia.

**Mapa de Ocupacao:**
A visualizacao do mapa de ocupacao mostra todos os bins da zona com indicadores visuais de ocupacao (vazio, parcial, cheio, bloqueado), facilitando a gestao visual do espaco.`,
  },

  // 6. Guide: Inventory Labels
  {
    module: 'stock',
    feature: 'inventory-labels',
    type: 'guide',
    keywords: ['etiqueta', 'label', 'impressao', 'codigo de barras', 'qr code'],
    requiredPermissions: ['stock.items.access'],
    navPath: 'Menu > Estoque > Produtos > Etiquetas',
    title: 'Como Gerar Etiquetas de Inventario',
    content: `**O que sao Etiquetas de Inventario?**
Etiquetas sao identificadores visuais impressos que acompanham os itens fisicos no armazem. Elas contem codigos de barras, QR codes e informacoes essenciais para identificacao rapida.

**Informacoes na Etiqueta:**
- **Codigo de barras Code128**: Para leitura com scanner convencional.
- **QR Code**: Para leitura com dispositivos moveis, contendo o fullCode do item.
- **Nome do Produto**: Identificacao textual.
- **Variante**: Nome da variante (cor, tamanho, etc.).
- **Codigo SKU**: Referencia rapida da variante.
- **Localizacao (Bin)**: Endereco do bin onde o item esta armazenado.
- **Lote e Validade**: Quando aplicavel.

**Como Gerar Etiquetas:**

1. Acesse a pagina do produto ou variante desejada.
2. Selecione os itens para os quais deseja gerar etiquetas.
3. Clique em **"Gerar Etiquetas"**.
4. O sistema gera as etiquetas em formato adequado para impressao.

**Via API:**
As etiquetas tambem podem ser obtidas via endpoint:
- **GET /v1/items/labels** — Retorna dados de etiquetas para os itens especificados.

**Permissao Necessaria:**
E necessaria a permissao **stock.items.access** para acessar os dados de etiquetas.

**Dicas de Uso:**
- Imprima etiquetas ao receber mercadoria (entrada PURCHASE).
- Atualize etiquetas apos transferencias entre bins.
- Use QR codes para inventario rapido com dispositivos moveis.
- Mantenha etiquetas legiveis; reimprima quando danificadas.

**Codigos Automaticos:**
Todos os codigos (Code128, EAN-13, UPC) sao gerados automaticamente pelo sistema a partir do fullCode hierarquico. O QR Code e o unico codigo que pode ser editado manualmente, permitindo incluir URLs personalizadas ou informacoes adicionais.`,
  },

  // 7. Troubleshooting: Product Not Showing
  {
    module: 'stock',
    feature: 'product-not-showing',
    type: 'troubleshooting',
    keywords: ['produto', 'nao aparece', 'sumiu', 'invisivel', 'filtro'],
    requiredPermissions: ['stock.products.access'],
    title: 'Produto Nao Aparece na Listagem',
    content: `**Problema:** Voce cadastrou ou sabe que um produto existe, mas ele nao aparece na listagem de produtos.

**Causas e Solucoes:**

**1. Status do Produto:**
O produto pode estar com status INACTIVE, DISCONTINUED ou DRAFT. Por padrao, a listagem mostra apenas produtos ACTIVE.
- **Solucao:** Verifique os filtros de status na listagem. Remova o filtro de status ou selecione "Todos" para visualizar produtos em qualquer status.

**2. Filtro de Categoria Ativo:**
Um filtro de categoria pode estar restringindo os resultados.
- **Solucao:** Limpe todos os filtros de categoria clicando em "Limpar Filtros" na barra de ferramentas.

**3. Termo de Busca Muito Especifico:**
A busca textual procura por correspondencia parcial no nome e descricao. Termos muito longos ou com erro de digitacao podem nao retornar resultados.
- **Solucao:** Simplifique o termo de busca. Use palavras-chave curtas.

**4. Produto Foi Excluido (Soft Delete):**
Produtos excluidos sao marcados com soft delete (campo deletedAt preenchido) e nao aparecem em listagens normais.
- **Solucao:** Verifique a lixeira do sistema, se disponivel. Produtos excluidos podem ser restaurados por um administrador.

**5. Permissao Insuficiente:**
O usuario pode nao ter a permissao **stock.products.access** necessaria para visualizar produtos.
- **Solucao:** Verifique com o administrador se o seu perfil (role) possui a permissao de acesso a produtos do estoque.

**6. Tenant Incorreto:**
Em ambientes multi-tenant, o produto pode ter sido cadastrado em outro tenant.
- **Solucao:** Verifique se voce esta logado no tenant correto. Use o seletor de tenant no menu superior para trocar, se necessario.

**Se o problema persistir:** Entre em contato com o administrador do sistema informando o nome exato do produto e o tenant em que deveria estar.`,
  },

  // 8. Troubleshooting: Negative Stock
  {
    module: 'stock',
    feature: 'stock-negative',
    type: 'troubleshooting',
    keywords: [
      'estoque negativo',
      'quantidade',
      'zerado',
      'falta',
      'divergencia',
    ],
    requiredPermissions: ['stock.items.access'],
    title: 'Estoque Ficou Negativo ou Zerado',
    content: `**Problema:** A quantidade de estoque de um item esta zerada ou apresenta divergencia em relacao ao estoque fisico real.

**Causas e Solucoes:**

**1. Saida Registrada Sem Entrada Suficiente:**
Uma movimentacao de saida (SALE, PRODUCTION, LOSS, etc.) foi registrada para uma quantidade maior do que a disponivel.
- **Solucao:** Verifique o historico de movimentacoes do item. Acesse a aba "Movimentacoes" na pagina do item e confira se todas as entradas foram registradas corretamente. Se necessario, registre uma entrada corretiva do tipo PURCHASE ou INVENTORY_ADJUSTMENT.

**2. Movimentacoes Duplicadas:**
Uma mesma saida pode ter sido registrada mais de uma vez (ex: duplo clique no botao de confirmacao).
- **Solucao:** No historico de movimentacoes, verifique se ha registros duplicados (mesmo tipo, quantidade e horario proximo). Registre um ajuste de inventario (INVENTORY_ADJUSTMENT) para corrigir a quantidade.

**3. Transferencia para Bin Incorreto:**
O item pode ter sido transferido para um bin diferente do esperado, fazendo parecer que o estoque do bin original ficou zerado.
- **Solucao:** Verifique o campo **lastKnownAddress** do item e a localizacao atual (binId). Consulte o mapa de ocupacao da zona para localizar o item.

**4. Divergencia de Contagem Fisica:**
O estoque no sistema pode divergir do estoque fisico real por erros acumulados ao longo do tempo.
- **Solucao:** Realize um inventario fisico (contagem). Use movimentacoes do tipo INVENTORY_ADJUSTMENT para ajustar as quantidades no sistema de acordo com a contagem real. Documente o motivo do ajuste no campo de notas.

**5. Itens com Status Incorreto:**
Itens marcados como DAMAGED, EXPIRED ou DISPOSED nao sao contabilizados como estoque disponivel.
- **Solucao:** Verifique se ha itens com esses status que deveriam estar AVAILABLE. Corrija o status conforme a situacao real.

**Prevencao:** Configure alertas de estoque baixo (LOW_STOCK) e ponto de reposicao (REORDER_POINT) para receber notificacoes antes que o estoque chegue a zero.`,
  },

  // 9. Troubleshooting: Movement Errors
  {
    module: 'stock',
    feature: 'movement-errors',
    type: 'troubleshooting',
    keywords: ['movimentacao', 'erro', 'transferencia', 'falha', 'bloqueado'],
    requiredPermissions: ['stock.items.modify'],
    title: 'Erros em Movimentacoes de Estoque',
    content: `**Problema:** Ao tentar registrar uma movimentacao de estoque, o sistema retorna um erro.

**Erros Comuns e Solucoes:**

**1. "Bin bloqueado" / "Bin is blocked":**
O bin de destino esta temporariamente bloqueado para movimentacoes.
- **Causa:** O bin foi bloqueado por um administrador para manutencao, reorganizacao ou inventario.
- **Solucao:** Desbloqueie o bin antes de realizar a movimentacao. Acesse Estoque > Localizacoes > [Armazem] > [Zona] e clique em "Desbloquear" no bin desejado. E necessaria a permissao stock.warehouses.modify.

**2. "Quantidade insuficiente" / "Insufficient quantity":**
A quantidade solicitada para saida ou transferencia excede o estoque disponivel do item.
- **Causa:** O estoque atual (currentQuantity) do item e menor que a quantidade da movimentacao.
- **Solucao:** Verifique a quantidade disponivel do item antes de registrar a movimentacao. Se necessario, registre uma entrada primeiro ou ajuste a quantidade da movimentacao.

**3. "Item nao encontrado" / "Item not found":**
O ID do item informado nao corresponde a nenhum item ativo no sistema.
- **Causa:** O item pode ter sido excluido (soft delete), o ID esta incorreto, ou o item pertence a outro tenant.
- **Solucao:** Verifique o ID do item. Confirme que o item existe e esta ativo no tenant correto. Use a busca por codigo de barras ou fullCode para localizar o item.

**4. "Destino invalido" / "Invalid destination":**
O bin de destino da transferencia nao existe ou nao esta ativo.
- **Causa:** O bin foi removido, desativado, ou o endereco informado esta incorreto.
- **Solucao:** Verifique se o bin de destino existe e esta ativo. Consulte o mapa de ocupacao da zona para confirmar bins disponiveis.

**5. "Permissao negada" / "Permission denied":**
O usuario nao possui as permissoes necessarias para o tipo de movimentacao.
- **Causa:** Movimentacoes de saida requerem stock.items.modify. Transferencias podem exigir permissoes adicionais.
- **Solucao:** Solicite ao administrador que atribua as permissoes necessarias ao seu perfil.

**Dica:** Toda tentativa de movimentacao (bem-sucedida ou nao) e registrada no log de auditoria para rastreabilidade.`,
  },

  // 10. Limitations
  {
    module: 'stock',
    feature: 'limitations',
    type: 'limitation',
    keywords: ['limitacao', 'restricao', 'nao suporta', 'impossivel'],
    requiredPermissions: ['stock.products.access'],
    title: 'Limitacoes Conhecidas do Modulo de Estoque',
    content: `**Limitacoes atuais do Modulo de Estoque:**

**1. Precisao de Quantidades:**
As quantidades de itens suportam no maximo 3 casas decimais (Decimal(10,3)). Valores com maior precisao serao arredondados automaticamente. Isso se aplica a quantidade inicial, quantidade atual e quantidades de movimentacao.

**2. Template Imutavel:**
O template de um produto **nao pode ser alterado** apos a criacao. Se for necessario mudar o template, sera preciso criar um novo produto com o template correto e transferir as variantes e itens manualmente. Essa restricao existe porque o template define a estrutura de atributos e o codigo hierarquico do produto.

**3. Endereco de Bins Automatico:**
Os enderecos dos bins sao **gerados automaticamente** a partir da estrutura da zona e **nao podem ser definidos manualmente**. O formato segue o padrao ARMAZEM-ZONA-CORREDOR.PRATELEIRA-POSICAO. Se precisar de uma organizacao diferente, configure a estrutura da zona adequadamente.

**4. Importacao em Lote:**
A importacao em massa de itens suporta no maximo **1000 itens por lote**. Para volumes maiores, divida a importacao em multiplos lotes. Cada lote e processado de forma atomica (tudo ou nada).

**5. Pedidos de Compra Confirmados:**
Pedidos de compra **nao podem ser editados** apos atingirem o status CONFIRMED. Apenas pedidos com status DRAFT ou PENDING podem ser modificados. Se houver necessidade de alteracao apos a confirmacao, o pedido deve ser cancelado e um novo deve ser criado.

**6. Volumes e Multi-Tenant:**
Todos os itens de um volume devem pertencer ao **mesmo tenant**. Nao e possivel criar volumes com itens de tenants diferentes. Essa restricao garante o isolamento de dados entre organizacoes.

**7. Codigos Hierarquicos Imutaveis:**
O fullCode de produtos, variantes e itens e **gerado automaticamente e imutavel**. Os codigos de barras (Code128, EAN-13, UPC) tambem sao gerados a partir do fullCode e nao podem ser alterados. Apenas o QR Code e editavel manualmente.

**8. Exclusao Logica (Soft Delete):**
Produtos, variantes e itens utilizam exclusao logica. Registros excluidos permanecem no banco de dados com o campo deletedAt preenchido. Isso preserva o historico de movimentacoes e auditoria, mas impacta consultas de performance em volumes muito grandes.`,
  },
];
