# Redesign de Templates e Produtos — Spec

**Data:** 2026-03-10
**Status:** Aprovado
**Escopo:** Backend (OpenSea-API) + Frontend (OpenSea-APP)

## Objetivo

Transformar o sistema de templates de um modelo genérico (folha em branco) para um sistema com presets pré-configurados por tipo de produto, mantendo a flexibilidade de personalização. Simultaneamente, reorganizar a estrutura de dados para suportar diferentes categorias de produto (têxtil, alimentos, farmácia, eletrônicos, etc.) com funcionalidades específicas por tipo.

## Decisões Arquiteturais

### 1. Presets como JSON estático no frontend
Presets ficam em `src/data/template-presets.ts` — não no banco. São "receitas" que pré-preenchem o formulário de criação de template. Adicionar novos presets requer deploy, mas evita complexidade de CRUD e gerenciamento no Central.

### 2. Módulos especiais com tabelas dedicadas
O template declara quais módulos especiais estão habilitados via `specialModules: string[]`. Cada módulo, quando implementado, ganha sua própria tabela com schema dedicado (não JSON genérico). Na v1 apenas `CARE_INSTRUCTIONS` é funcional. Validação dos valores é feita na camada de aplicação (Zod), não como enum Prisma — permite adicionar novos módulos sem migration.

### 3. Anexos são nativos
Todo produto e variante pode ter anexos (PDFs, laudos, manuais), independente do template. Tabelas dedicadas `ProductAttachment` e `VariantAttachment`.

### 4. Preços de venda ficam para o módulo de vendas
Campo `price` e `profitMargin` continuam na Variant por enquanto. A migração para Tabela de Preços no módulo de vendas está documentada em `central-implementation/sales/price-table-decision.md`.

### 5. CareInstructionId referencia catálogo estático (não tabela)
`ProductCareInstruction.careInstructionId` é um código string que referencia o catálogo ISO 3758 carregado pelo `CareCatalogProvider` (singleton que lê `assets/care/manifest.json`). Não existe tabela `CareInstruction` no banco — a validação dos IDs é feita no use case via `CareCatalogProvider.exists(id)`.

### 6. Descarte intencional de Template.careLabel
O campo `Template.careLabel` (JSON com washing/drying/ironing/bleaching/dryClean/composition) é descartado na migração. Esse campo era pouco utilizado e conceitualmente errado (care info pertence ao produto, não ao template). Nenhum sistema downstream depende desse campo.

---

## Modelo de Dados — Mudanças

### Template

| Campo | Ação | Detalhe |
|-------|------|---------|
| `careLabel` | **REMOVE** | Migra para ProductCareInstruction no nível do produto |
| `specialModules` | **ADICIONA** | `String[] @default([])` — enum values: `CARE_INSTRUCTIONS`, futuramente `DRUG_LEAFLET`, `TECHNICAL_MANUAL`, `NUTRITIONAL_INFO`, `TECHNICAL_SPECS` |
| `unitOfMeasure` | **EXPANDE** | De 3 para 10 valores no enum |

**Enum `UnitOfMeasure` expandido:**

| Código | Label | Abreviação |
|--------|-------|------------|
| UNITS | Unidades | un |
| METERS | Metros | m |
| KILOGRAMS | Quilogramas | kg |
| GRAMS | Gramas | g |
| LITERS | Litros | L |
| MILLILITERS | Mililitros | mL |
| SQUARE_METERS | Metros quadrados | m² |
| PAIRS | Pares | par |
| BOXES | Caixas | cx |
| PACKS | Pacotes | pct |

**Sem mudança:** `productAttributes`, `variantAttributes`, `itemAttributes` (JSON de atributos customizados).

### Variant

| Campo | Ação | Detalhe |
|-------|------|---------|
| `imageUrl` | **REMOVE** | Substituído por `VariantImage[]` (tabela já existe) |
| `secondaryColorHex` | **ADICIONA** | `String? @db.VarChar(7)` |
| `secondaryColorPantone` | **ADICIONA** | `String? @db.VarChar(32)` |
| `pattern` | **ADICIONA** | `Pattern?` (novo enum) |

**Enum `Pattern`:**
- SOLID (Sólido)
- STRIPED (Listrado)
- PLAID (Xadrez)
- PRINTED (Estampado)
- GRADIENT (Degradê)
- JACQUARD (Jacquard)

**`VariantImage`** (já existe) — passa a usar URLs relativas do Storage com upload integrado.

### Product

| Campo | Ação | Detalhe |
|-------|------|---------|
| `careInstructionIds` | **REMOVE** | Migra para tabela `ProductCareInstruction` |

### Novas Tabelas

#### ProductCareInstruction
`careInstructionId` é um código string do catálogo ISO 3758 (ex: "WASH_30", "IRON_LOW"). Não é FK para outra tabela — validado via `CareCatalogProvider`.
```prisma
model ProductCareInstruction {
  id                String   @id @default(uuid())
  productId         String   @map("product_id")
  tenantId          String   @map("tenant_id")
  careInstructionId String   @map("care_instruction_id")
  order             Int      @default(0)
  createdAt         DateTime @default(now()) @map("created_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  tenant  Tenant  @relation(fields: [tenantId], references: [id])

  @@unique([productId, careInstructionId])
  @@index([productId])
  @@index([tenantId])
  @@map("product_care_instructions")
}
```

#### ProductAttachment
```prisma
model ProductAttachment {
  id        String   @id @default(uuid())
  productId String   @map("product_id")
  tenantId  String   @map("tenant_id")
  fileUrl   String   @db.VarChar(512)
  fileName  String   @db.VarChar(256)
  fileSize  Int
  mimeType  String   @db.VarChar(128)
  label     String?  @db.VarChar(128)
  order     Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  tenant  Tenant  @relation(fields: [tenantId], references: [id])

  @@index([productId])
  @@index([tenantId])
  @@map("product_attachments")
}
```

#### VariantAttachment
```prisma
model VariantAttachment {
  id        String   @id @default(uuid())
  variantId String   @map("variant_id")
  tenantId  String   @map("tenant_id")
  fileUrl   String   @db.VarChar(512)
  fileName  String   @db.VarChar(256)
  fileSize  Int
  mimeType  String   @db.VarChar(128)
  label     String?  @db.VarChar(128)
  order     Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  variant Variant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  tenant  Tenant  @relation(fields: [tenantId], references: [id])

  @@index([variantId])
  @@index([tenantId])
  @@map("variant_attachments")
}
```

---

## Presets de Template

### Estrutura TypeScript

```typescript
interface TemplatePreset {
  id: string;                          // Slug único (ex: "camiseta", "tecido", "medicamento")
  name: string;                        // Nome de exibição (ex: "Camiseta", "Tecido")
  description: string;                 // Descrição curta (1 linha)
  icon: string;                        // Nome do ícone react-icons (ex: "GiTShirt", "GiSewingMachine")
  category: PresetCategory;
  unitOfMeasure: UnitOfMeasure;
  specialModules: SpecialModule[];     // Valores: 'CARE_INSTRUCTIONS' (v1)
  productAttributes: TemplateAttributes;
  variantAttributes: TemplateAttributes;
  itemAttributes: TemplateAttributes;
}

// Códigos sem acentos (uso interno). Labels com acentos são mapeados no frontend.
type PresetCategory =
  | 'TEXTIL'           // Label: "Têxtil / Vestuário"
  | 'TECIDOS'          // Label: "Tecidos / Malhas"
  | 'CALCADOS'         // Label: "Calçados"
  | 'ALIMENTOS'        // Label: "Alimentos"
  | 'FARMACIA'         // Label: "Farmácia"
  | 'ELETRONICOS'      // Label: "Eletrônicos"
  | 'SERIGRAFIA'       // Label: "Serigrafia"
  | 'VAREJO';          // Label: "Mercado / Varejo"

type SpecialModule = 'CARE_INSTRUCTIONS'; // Futuros: 'DRUG_LEAFLET' | 'TECHNICAL_MANUAL' | 'NUTRITIONAL_INFO' | 'TECHNICAL_SPECS'
```

### Catálogo Completo (v1)

#### TÊXTIL / VESTUÁRIO

**Camiseta** — UNITS, CARE_INSTRUCTIONS
- Produto: Composição (text), Gramatura (number, g/m²), Tipo de Tecido (select)
- Variante: Tamanho (select: PP/P/M/G/GG/XG), Acabamento (select: Liso/Estampado/Bordado/Sublimado/Tingido), Anti-odor (boolean), Passa Fácil (boolean), Não Amarrota (boolean), Não Desbota (boolean)
- Item: Lote (text), Data de fabricação (date)

**Calça** — UNITS, CARE_INSTRUCTIONS
- Produto: Composição, Gramatura, Tipo de Tecido
- Variante: Tamanho (select: 34-54), Acabamento, Anti-odor, Passa Fácil, Não Amarrota, Não Desbota
- Item: Lote, Data de fabricação

**Vestido** — UNITS, CARE_INSTRUCTIONS
- Produto: Composição, Gramatura, Tipo de Tecido
- Variante: Tamanho (select: PP-XG), Acabamento, Comprimento (select: Curto/Midi/Longo), Anti-odor, Passa Fácil, Não Amarrota, Não Desbota
- Item: Lote, Data de fabricação

**Lençol** — UNITS, CARE_INSTRUCTIONS
- Produto: Composição, Gramatura, Fio (number)
- Variante: Tamanho (select: Solteiro/Casal/Queen/King), Acabamento, Anti-odor, Passa Fácil, Não Amarrota, Não Desbota
- Item: Lote, Data de fabricação

**Toalha** — UNITS, CARE_INSTRUCTIONS
- Produto: Composição, Gramatura
- Variante: Tamanho (select: Rosto/Banho/Praia/Piso), Acabamento, Anti-odor, Passa Fácil, Não Amarrota, Não Desbota
- Item: Lote, Data de fabricação

#### TECIDOS / MALHAS

**Tecido** — METERS, CARE_INSTRUCTIONS
- Produto: Stretch (number, %), Gramatura (number, g/m²), Composição (text), Construção (select: Tela/Tela-Rip-Stop/Sarja-2/1/Sarja-2/1-Rip-Stop/Sarja-3/1/Sarja-3/1-Rip-Stop/Maquinetado/Sarja-2/2), Largura Padrão (number, m), Código no Fabricante (text)
- Variante: Anti-odor (boolean), Anti-Chamas (boolean), Proteção UV (boolean), Repelente (boolean), Passa Fácil (boolean), Não Amarrota (boolean), Não Desbota (boolean)
- Item: Nuance (text), Qualidade (select: 1ª Qualidade/2ª Qualidade), Peso da Peça (number, kg), Largura da Peça (number, m)

**Malha** — KILOGRAMS, CARE_INSTRUCTIONS
- Produto: Stretch (number, %), Gramatura (number, g/m²), Composição (text), Construção (select: mesmas opções), Largura Padrão (number, m), Código no Fabricante (text)
- Variante: Anti-odor (boolean), Anti-Chamas (boolean), Proteção UV (boolean), Repelente (boolean), Passa Fácil (boolean), Não Amarrota (boolean), Não Desbota (boolean)
- Item: Nuance (text), Qualidade (select: 1ª Qualidade/2ª Qualidade), Peso da Peça (number, kg), Largura da Peça (number, m)

**Linha** — UNITS, CARE_INSTRUCTIONS
- Produto: Composição (text), Espessura (text), Material (text)
- Variante: —
- Item: Lote (text)

**Aviamento** — UNITS
- Produto: Material (text)
- Variante: Tamanho (text)
- Item: Lote (text)

#### CALÇADOS

**Tênis** — PAIRS, CARE_INSTRUCTIONS
- Produto: Material Superior (text), Material Sola (text), Tipo (select: Corrida/Casual/Skate/Social)
- Variante: Numeração (select: 34-46)
- Item: Lote (text), Data de fabricação (date)

**Sapato** — PAIRS, CARE_INSTRUCTIONS
- Produto: Material Superior, Material Sola, Tipo (select: Social/Casual/Mocassim)
- Variante: Numeração (select: 34-46)
- Item: Lote, Data de fabricação

**Sandália** — PAIRS, CARE_INSTRUCTIONS
- Produto: Material Superior, Material Sola
- Variante: Numeração (select: 33-44)
- Item: Lote, Data de fabricação

#### ALIMENTOS

**Alimento** — UNITS
- Produto: Peso Líquido (number, g), Tipo (select: Perecível/Não-Perecível/Congelado), Contém Glúten (boolean), Contém Lactose (boolean), Vegano (boolean)
- Variante: Sabor (text), Embalagem (select: Unidade/Pacote/Caixa)
- Item: Lote (text), Data de fabricação (date), Data de validade (date)

**Bebida** — UNITS
- Produto: Volume (number, mL), Teor Alcoólico (number, %), Tipo (select: Refrigerante/Suco/Água/Cerveja/Vinho/Destilado)
- Variante: Sabor (text), Embalagem (select: Lata/Garrafa/Pet/Tetra Pak)
- Item: Lote, Data de fabricação, Data de validade

#### FARMÁCIA

**Medicamento** — UNITS
- Produto: Princípio Ativo (text), Concentração (text), Via (select: Oral/Tópica/Injetável/Inalatória), Receita Obrigatória (boolean), Registro ANVISA (text)
- Variante: Apresentação (select: Comprimido/Cápsula/Líquido/Pomada/Spray), Quantidade (text)
- Item: Lote (text), Data de fabricação (date), Data de validade (date)

**Cosmético** — UNITS
- Produto: Tipo (select: Creme/Shampoo/Condicionador/Perfume/Maquiagem), Volume (number, mL)
- Variante: Fragrância (text), Variação (text)
- Item: Lote, Data de fabricação, Data de validade

**Suplemento** — UNITS
- Produto: Tipo (select: Vitamina/Proteína/Creatina/Aminoácido/Pré-Treino), Peso Líquido (number, g)
- Variante: Sabor (text), Quantidade (text)
- Item: Lote, Data de fabricação, Data de validade

#### ELETRÔNICOS

**Eletrônico Genérico** — UNITS
- Produto: Marca (text), Modelo (text), Voltagem (select: 110V/220V/Bivolt/Bateria), Garantia (number, meses)
- Variante: Capacidade (text)
- Item: Número de Série (text), Data de fabricação (date)

**Celular** — UNITS
- Produto: Marca, Modelo, Sistema (select: Android/iOS), Tela (number, pol)
- Variante: Armazenamento (select: 64GB/128GB/256GB/512GB/1TB), RAM (select: 4GB/6GB/8GB/12GB/16GB), Cor (text)
- Item: IMEI (text), Data de fabricação

**Notebook** — UNITS
- Produto: Marca, Modelo, Processador (text), Tela (number, pol)
- Variante: Armazenamento, RAM, Cor (text)
- Item: Número de Série, Data de fabricação

#### SERIGRAFIA

**Tinta Serigrafia** — KILOGRAMS
- Produto: Tipo (select: Plastisol/Base Água/Sublimática/UV), Cobertura (select: Opaca/Translúcida/Transparente), Secagem (select: Estufa/Ar/UV)
- Variante: —
- Item: Lote (text), Data de fabricação (date), Data de validade (date)

**Tela Serigrafia** — UNITS
- Produto: Mesh (select: 32/43/55/77/90/120/150/180), Material (select: Poliéster/Nylon), Dimensão (text)
- Variante: —
- Item: Lote (text)

**Substrato** — UNITS
- Produto: Tipo (select: Algodão/Poliéster/Papel/Vinil/Acrílico/Metal), Gramatura (number, g/m²)
- Variante: Tamanho (text)
- Item: Lote (text)

#### MERCADO / VAREJO

**Produto Genérico** — UNITS
- Produto: Marca (text), Peso Líquido (number, g)
- Variante: Variação (text), Embalagem (text)
- Item: Lote (text), Data de validade (date)

**Limpeza** — UNITS
- Produto: Tipo (select: Detergente/Desinfetante/Amaciante/Sabão/Multiuso), Volume (number, mL), Fragrância (text)
- Variante: Variação (text)
- Item: Lote, Data de validade

**Higiene** — UNITS
- Produto: Tipo (select: Sabonete/Desodorante/Pasta de Dente/Papel Higiênico/Absorvente), Peso/Volume (text)
- Variante: Fragrância (text), Variação (text)
- Item: Lote, Data de validade

---

## Fluxo do Modal de Criação de Template

### Tela 1 — Grade de Presets
- Modal abre com tabs horizontais por categoria (Têxtil, Tecidos, Calçados, Alimentos, Farmácia, Eletrônicos, Serigrafia, Varejo)
- Cada tab mostra grade de cards: ícone + nome + descrição curta
- Abaixo da grade: botão `w-full` "Configurar um Novo Template" (variante outline/secondary)

### Tela 2a — Preview do Preset (ao clicar num preset)
- Header com seta de voltar + nome do preset
- Seções colapsáveis:
  - Unidade de medida
  - Módulos especiais habilitados (ex: "Conservação Têxtil")
  - Atributos de produto (nome, tipo, obrigatório)
  - Atributos de variante
  - Atributos de item
- Rodapé: botão `w-full` "Adicionar Template" (primary)
- Cria o template e fecha o modal

### Tela 2b — Criação Manual (ao clicar "Configurar um Novo Template")
- Formulário: Nome + Unidade de Medida
- Botão "Criar Template"
- Cria template vazio e fecha o modal

---

## Estrutura de Pastas no Storage

```
/tenants/{tenantId}/
  products/
    {product-slug}/
      attachments/
        laudo-tecnico.pdf
      variants/
        {variant-slug}/
          images/
            foto-frente.jpg
            foto-costas.jpg
          attachments/
            ficha-tecnica.pdf
```

- Pastas nomeadas pelo slug (legível, não UUID)
- `VariantImage.url` armazena path relativo
- `ProductAttachment.fileUrl` e `VariantAttachment.fileUrl` seguem o mesmo padrão
- Soft delete não remove arquivos físicos

---

## Permissões RBAC

Novas permissões seguindo o padrão `{module}.{resource}.{action}`:

| Código | Descrição |
|--------|-----------|
| `stock.product-care-instructions.create` | Adicionar instrução de conservação a um produto |
| `stock.product-care-instructions.read` | Visualizar instruções de conservação |
| `stock.product-care-instructions.delete` | Remover instrução de conservação |
| `stock.product-attachments.create` | Anexar arquivo a um produto |
| `stock.product-attachments.read` | Visualizar anexos do produto |
| `stock.product-attachments.delete` | Remover anexo do produto |
| `stock.variant-attachments.create` | Anexar arquivo a uma variante |
| `stock.variant-attachments.read` | Visualizar anexos da variante |
| `stock.variant-attachments.delete` | Remover anexo da variante |

Permissões existentes que não mudam: `stock.templates.*`, `stock.products.*`, `stock.variants.*`.

---

## Endpoints da API

### ProductCareInstruction

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| POST | `/v1/products/:productId/care-instructions` | `stock.product-care-instructions.create` | Adiciona care instruction ao produto (body: `{ careInstructionId, order? }`) |
| GET | `/v1/products/:productId/care-instructions` | `stock.product-care-instructions.read` | Lista care instructions do produto (ordenado por `order`) |
| DELETE | `/v1/products/:productId/care-instructions/:id` | `stock.product-care-instructions.delete` | Remove care instruction do produto |

### ProductAttachment

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| POST | `/v1/products/:productId/attachments` | `stock.product-attachments.create` | Upload de anexo (multipart/form-data: file + label?) |
| GET | `/v1/products/:productId/attachments` | `stock.product-attachments.read` | Lista anexos do produto |
| DELETE | `/v1/products/:productId/attachments/:id` | `stock.product-attachments.delete` | Remove anexo do produto (e arquivo do Storage) |

### VariantAttachment

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| POST | `/v1/variants/:variantId/attachments` | `stock.variant-attachments.create` | Upload de anexo |
| GET | `/v1/variants/:variantId/attachments` | `stock.variant-attachments.read` | Lista anexos da variante |
| DELETE | `/v1/variants/:variantId/attachments/:id` | `stock.variant-attachments.delete` | Remove anexo da variante |

### Endpoints existentes que mudam

| Endpoint | Mudança |
|----------|---------|
| `POST /v1/templates` | Aceita `specialModules` no body, remove `careLabel`, novos valores em `unitOfMeasure` |
| `PUT /v1/templates/:id` | Mesmo |
| `POST /v1/products` | Remove `careInstructionIds` do body |
| `PUT /v1/products/:id` | Remove `careInstructionIds` do body |
| `PUT /v1/products/:id/care-instructions` | **REMOVIDO** — substituído pelos novos endpoints acima |
| `POST /v1/variants` | Remove `imageUrl`, aceita `secondaryColorHex`, `secondaryColorPantone`, `pattern` |
| `PUT /v1/variants/:id` | Mesmo |

Todos os endpoints de escrita exigem `[verifyJwt, verifyTenant, verifyPermission('...')]`.

---

## Breaking Changes e Migrações

### Backend — Prisma

| Ação | Detalhe |
|------|---------|
| ALTER Template | Remove `careLabel`, adiciona `specialModules String[]`, expande enum `UnitOfMeasure` |
| ALTER Variant | Remove `imageUrl`, adiciona `secondaryColorHex`, `secondaryColorPantone`, `pattern` |
| ALTER Product | Remove `careInstructionIds` |
| CREATE enum `Pattern` | SOLID, STRIPED, PLAID, PRINTED, GRADIENT, JACQUARD |
| CREATE `ProductCareInstruction` | productId + careInstructionId + order |
| CREATE `ProductAttachment` | productId + fileUrl + fileName + fileSize + mimeType + label + order |
| CREATE `VariantAttachment` | variantId + fileUrl + fileName + fileSize + mimeType + label + order |

### Backend — Código

| Ação | Detalhe |
|------|---------|
| Refactor Template entity | Remove careLabel, adiciona specialModules |
| Refactor Product entity | Remove careInstructionIds, remove value object CareInstructions |
| Refactor Variant entity | Remove imageUrl, adiciona novos campos |
| Remove `SetProductCareInstructions` use case | Substituído por CRUD de ProductCareInstruction |
| Create use cases ProductCareInstruction | Create, List, Delete |
| Create use cases ProductAttachment | Create, List, Delete |
| Create use cases VariantAttachment | Create, List, Delete |
| Update schemas Zod | Template, Product, Variant |
| Update mappers/DTOs | Template, Product, Variant |
| Update repositórios (Prisma + in-memory) | Template, Product, Variant |

### Frontend

| Ação | Detalhe |
|------|---------|
| Create `src/data/template-presets.ts` | ~20 presets organizados por categoria |
| Refactor modal de criação de template | Grade de presets + preview + criação manual |
| Update tipos | Template, Product, Variant, attachments |
| Update formulários de variante | Secondary color, pattern, upload via Storage, anexos |
| Update página de produto | Care instructions via tabela separada, anexos |
| Create componente Pattern visual | Renderiza sólido/listrado/xadrez/etc. |

### Migração de Dados

#### 1. Template.careLabel → descartado
Dados removidos. Campo era pouco utilizado. Sem script de migração.

#### 2. Product.careInstructionIds → ProductCareInstruction
Script de migração Prisma:
- Para cada Product com `careInstructionIds` não-vazio
- Para cada string no array (são códigos ISO 3758 do CareCatalogProvider, ex: "WASH_30")
- Criar um registro `ProductCareInstruction` com `productId`, `tenantId` (do produto), `careInstructionId` (o código string), `order` (posição no array)
- Validar cada código contra `CareCatalogProvider.exists()` — códigos inválidos são ignorados

#### 3. Variant.imageUrl → VariantImage
Script de migração Prisma:
- Para cada Variant com `imageUrl` não-nulo
- Se já existem registros em `VariantImage` para essa variante: ignorar (não duplicar)
- Se não existem: criar `VariantImage` com `url: imageUrl`, `isPrimary: true`, `order: 0`
- Depois da migração, coluna `imageUrl` é removida do modelo

#### 4. VariantImage URLs existentes
URLs absolutas existentes (http/https) continuam funcionando — o frontend detecta se é URL absoluta ou relativa e trata adequadamente. Novas imagens usarão URLs relativas do Storage.

---

## Testes Afetados

### Testes que precisam de atualização

**Unit tests (use cases):**
- `src/use-cases/stock/templates/create-template.spec.ts` — remover careLabel dos testes
- `src/use-cases/stock/templates/update-template.spec.ts` — remover careLabel, adicionar specialModules
- `src/use-cases/stock/products/create-product.spec.ts` — remover careInstructionIds
- `src/use-cases/stock/products/set-product-care-instructions.spec.ts` — **REMOVER arquivo**
- `src/use-cases/stock/variants/create-variant.spec.ts` — remover imageUrl, adicionar novos campos

**E2E tests (controllers):**
- Controllers de templates — atualizar payloads
- Controllers de products — remover careInstructionIds dos payloads
- Controllers de variants — remover imageUrl, adicionar novos campos
- Controller `PUT /v1/products/:id/care-instructions` — **REMOVER arquivo**

**Novos testes a criar:**
- Unit + E2E para ProductCareInstruction (create, list, delete)
- Unit + E2E para ProductAttachment (create, list, delete)
- Unit + E2E para VariantAttachment (create, list, delete)
- In-memory repositories para as 3 novas entidades
