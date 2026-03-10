# Pattern: Entity and Value Object

## Problem

Como representar conceitos do domínio de negócio — como um Produto, um Usuário ou um endereço de e-mail — de forma que as regras de negócio sejam aplicadas de maneira consistente em todo o sistema, independente de onde o dado foi originado (HTTP, banco de dados, testes)?

Sem esse padrão, as validações ficam espalhadas por controllers, use cases e mappers, criando duplicação e permitindo que objetos em estado inválido circulem pelo sistema.

## Solution

O OpenSea-API utiliza dois tipos complementares de objetos de domínio, extraídos do Domain-Driven Design (DDD):

- **Entity (Entidade)**: possui identidade própria (`UniqueEntityID`), é mutável através de setters controlados e representa objetos que têm ciclo de vida (criação, atualização, exclusão).
- **Value Object (Objeto de Valor)**: não possui identidade; sua igualdade é baseada nos atributos. É imutável após a construção e encapsula regras de formato e validação de um único conceito.

```
Use Case recebe dados brutos (string, number)
           ↓
Value Objects validam e normalizam cada campo isoladamente
           ↓
Entity.create() recebe Value Objects já validados
           ↓
Entity representa o estado do domínio com invariantes garantidas
           ↓
Repository persiste / reconstrói a entidade
```

---

## Base Classes

### `Entity<Props>` — `src/entities/domain/entities.ts`

Todas as entidades do sistema herdam desta classe abstrata genérica.

```typescript
export abstract class Entity<Props> {
  private _id: UniqueEntityID;
  public props: Props;

  get id(): UniqueEntityID {
    return this._id;
  }

  protected constructor(props: Props, id?: UniqueEntityID) {
    this._id = id ?? new UniqueEntityID();
    this.props = props;
  }

  public equals(entity: Entity<unknown>) {
    if (entity === this) return true;
    if (entity.id === this._id) return true;
    return false;
  }
}
```

**Pontos importantes:**
- O construtor é `protected`, forçando o uso do método estático `create()` em subclasses.
- `props` é `public` para permitir leitura direta no mapper sem necessidade de todos os getters. O encapsulamento real é garantido pelos setters que chamam `touch()`.
- `equals()` compara por identidade de referência ou por `UniqueEntityID`, nunca por valor dos atributos.

---

### `UniqueEntityID` — `src/entities/domain/unique-entity-id.ts`

Encapsula o identificador único de qualquer entidade do domínio.

```typescript
import { randomUUID } from 'node:crypto';

export class UniqueEntityID {
  private value: string;

  constructor(value?: string) {
    this.value = value ?? randomUUID();
  }

  toString(): string { return this.value; }
  toValue(): string  { return this.value; }

  equals(id: UniqueEntityID): boolean {
    return id.toValue() === this.value;
  }
}
```

**Uso padrão:**
- Criação de nova entidade: `new UniqueEntityID()` (gera UUID v4 automaticamente).
- Reconstrução a partir do banco: `new UniqueEntityID('uuid-salvo-no-banco')`.
- No mapper, converte-se para string com `.toValue()` e de volta com `new UniqueEntityID(prismaRecord.id)`.

---

### `Optional<T, K>` — `src/entities/domain/optional.ts`

Utilitário de tipos que torna campos opcionais em interfaces, preservando os demais como obrigatórios. Usado em todos os métodos `create()` para definir quais campos têm valores padrão.

```typescript
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
```

**Exemplo de uso em `Product.create()`:**

```typescript
static create(
  props: Optional<
    ProductProps,
    'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'attributes' | 'status' | 'outOfLine'
  >,
  id?: UniqueEntityID,
): Product
```

Isso significa que `name`, `slug`, `fullCode`, `templateId` e outros campos são **obrigatórios** no `create()`, enquanto os listados em `Optional` podem ser omitidos (e receberão defaults internos).

---

## Entity Structure

### Anatomia de uma Entidade

Uma entidade segue sempre a mesma estrutura de quatro partes. O exemplo abaixo usa `Product`:

#### 1. Interface de Props

Define todos os campos que a entidade mantém em memória, incluindo Value Objects:

```typescript
// src/entities/stock/product.ts
export interface ProductProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  slug: Slug;          // Value Object — imutável após criação
  fullCode: string;    // gerado automaticamente — sem setter
  status: ProductStatus; // Value Object de status
  outOfLine: boolean;
  attributes: Record<string, unknown>;
  templateId: UniqueEntityID;
  supplierId?: UniqueEntityID;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  // ... outros campos e relações lazy-loaded
}
```

#### 2. Getters e Setters com `touch()`

Cada campo mutável expõe um setter que registra a data de atualização:

```typescript
export class Product extends Entity<ProductProps> {

  get name(): string { return this.props.name; }

  set name(name: string) {
    this.props.name = name;
    this.touch();          // atualiza updatedAt automaticamente
  }

  // Campos imutáveis têm apenas getter (sem setter):
  get slug(): Slug    { return this.props.slug; }
  get fullCode(): string { return this.props.fullCode; }
  get barcode(): string  { return this.props.barcode; }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
```

#### 3. Propriedades Computadas

Derivadas a partir do estado atual da entidade, sem persistência:

```typescript
get isDeleted(): boolean  { return !!this.props.deletedAt; }
get hasSupplier(): boolean { return !!this.props.supplierId; }

// Combina estado da entidade com regras do Value Object:
get canBeSold(): boolean {
  return this.props.status.canBeSold && !this.isDeleted;
}

get isPublishable(): boolean {
  return this.props.status.canBePublished && !this.isDeleted;
}
```

#### 4. Métodos de Negócio e `create()` estático

Métodos que encapsulam transições de estado e o factory method canônico:

```typescript
// Métodos de negócio — encapsulam mudanças de estado
activate(): void    { this.status = ProductStatus.create('ACTIVE'); }
deactivate(): void  { this.status = ProductStatus.create('INACTIVE'); }
discontinue(): void { this.status = ProductStatus.create('DISCONTINUED'); }
delete(): void      { this.props.deletedAt = new Date(); this.touch(); }
restore(): void     { this.props.deletedAt = undefined; this.touch(); }

// Factory method — único ponto de criação
static create(
  props: Optional<ProductProps, 'id' | 'createdAt' | 'attributes' | 'status' | 'outOfLine'>,
  id?: UniqueEntityID,
): Product {
  const product = new Product(
    {
      ...props,
      id: id ?? new UniqueEntityID(),
      attributes:  props.attributes  ?? {},
      status:      props.status      ?? ProductStatus.create('ACTIVE'),
      outOfLine:   props.outOfLine   ?? false,
      createdAt:   props.createdAt   ?? new Date(),
      updatedAt:   props.updatedAt,
      deletedAt:   props.deletedAt,
    },
    id,
  );
  return product;
}
```

**Por que o `id` aparece duas vezes no `create()`?**
O `id` é passado tanto dentro do objeto `props` (campo `id` da interface `ProductProps`) quanto como segundo argumento do construtor da `Entity` (que o armazena em `this._id`). Isso garante que `entity.id` e `entity.props.id` apontem para o mesmo `UniqueEntityID`.

---

## Value Objects

Value Objects no OpenSea-API não herdam de uma classe base comum (exceto `CPF`, que usa `ValueObject<T>` local). Cada um segue um contrato informal com os mesmos elementos:

1. Propriedade privada com `readonly` ou `private readonly`.
2. Construtor `private`, impedindo instanciação direta.
3. Método estático `create()` como único ponto de entrada.
4. Getter `value` para acesso ao dado primitivo subjacente.
5. Método `equals()` para comparação por valor.
6. Opcionalmente: `toString()`, getters computados, factory methods nomeados.

---

### Catálogo de Value Objects

#### `Email` — `src/entities/core/value-objects/email.ts`

Valida formato, normaliza para minúsculas e remove espaços. Lança `BadRequestError` em caso de e-mail inválido.

```typescript
export class Email {
  private constructor(value: string) {
    this._value = Email.format(value);         // normaliza primeiro
    if (!Email.isValid(this._value)) {
      throw new BadRequestError('Invalid email address.');
    }
  }

  static create(value: string): Email { return new Email(value); }
  static isValid(value: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
  static format(value: string): string  { return value.trim().toLowerCase(); }

  get value(): string { return this._value; }
  equals(other: Email): boolean { return this._value === other.value; }
  toString(): string { return this._value; }
}
```

#### `Username` — `src/entities/core/value-objects/username.ts`

Aceita 3–20 caracteres alfanuméricos e underline. Normaliza substituindo espaços por `_` e convertendo para minúsculas.

```typescript
static isValid(value: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(value);
}
static format(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}
// Factory adicional:
static random(): Username { /* gera "user" + UUID(8 chars) */ }
```

#### `Password` — `src/entities/core/value-objects/password.ts`

Value Object assíncrono — armazena apenas o hash bcrypt, nunca a senha em texto plano.

```typescript
// Dois modos de instanciação:
static async create(plaintext: string): Promise<Password>  // valida força + hasha
static fromHash(hash: string): Password                     // reconstrói do banco sem revalidar

// Utilitários:
static async hash(password: string, rounds?: number): Promise<string>
static async compare(password: string, hash: string): Promise<boolean>
static isStrong(password: string, options?): PasswordStrengthResult
```

A configuração de força (mínimo de caracteres, exigência de maiúscula/número/especial) vem de `src/config/auth.ts`.

#### `Pin` — `src/entities/core/value-objects/pin.ts`

Semelhante a `Password`, mas com dois tipos distintos: `access` (6 dígitos) e `action` (4 dígitos).

```typescript
static async create(plainText: string, type: PinType): Promise<Pin>
static fromHash(hash: string, type: PinType): Pin
static isValid(pin: string, type: PinType): boolean
```

#### `Token` — `src/entities/core/value-objects/token.ts`

Encapsula tokens de redefinição de senha ou confirmação. Carrega data de expiração opcional e expõe `isExpired()` como método de comportamento:

```typescript
static create(value: string, expiresAt?: Date): Token
isExpired(): boolean  // retorna false se não houver expiresAt
equals(other: Token): boolean  // compara valor + timestamp de expiração
```

#### `CPF` — `src/entities/hr/value-objects/cpf.ts`

Valida dígitos verificadores com o algoritmo oficial da Receita Federal. Normaliza removendo formatação (pontos e traço). Expõe getter `formatted` para exibição:

```typescript
static create(cpf: string): CPF           // lança Error se inválido
static isValid(cpf: string): boolean      // algoritmo completo com 2 dígitos verificadores
get formatted(): string                   // "XXX.XXX.XXX-XX"
get value(): string                       // apenas dígitos
```

#### `CNPJ` — `src/entities/stock/value-objects/cnpj.ts`

Comportamento diferente do `CPF`: o `create()` retorna `null` em vez de lançar exceção, para o caso de uso caller decidir como tratar a invalidade:

```typescript
static create(cnpj: string): CNPJ | null  // null se inválido (não lança)
get formatted(): string                    // "XX.XXX.XXX/XXXX-XX"
get unformatted(): string                  // apenas dígitos
equals(other: CNPJ): boolean              // compara por dígitos (sem formatação)
```

#### `ProductStatus` — `src/entities/stock/value-objects/product-status.ts`

Status enum com regras de negócio embutidas como getters booleanos:

```typescript
// Valores possíveis:
type ProductStatusValue = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'OUT_OF_STOCK';

// Regras de negócio como getters:
get canBeSold(): boolean    { return this.status === 'ACTIVE'; }
get canBePublished(): boolean { return this.status === 'ACTIVE' && !this.isOutOfStock; }
get requiresAttention(): boolean { return this.status === 'OUT_OF_STOCK' || this.status === 'DISCONTINUED'; }
get isVisible(): boolean    { return this.status === 'ACTIVE' || this.status === 'OUT_OF_STOCK'; }
```

#### `ItemStatus` — `src/entities/stock/value-objects/item-status.ts`

Similar ao `ProductStatus`, mas para itens físicos em estoque:

```typescript
type ItemStatusValue = 'AVAILABLE' | 'RESERVED' | 'IN_TRANSIT' | 'DAMAGED' | 'EXPIRED' | 'DISPOSED';

get canBeSold(): boolean      { return this.status === 'AVAILABLE'; }
get canBeReserved(): boolean  { return this.status === 'AVAILABLE'; }
get requiresAction(): boolean { return this.status === 'DAMAGED' || this.status === 'EXPIRED'; }
```

#### `UnitOfMeasure` — `src/entities/stock/value-objects/unit-of-measure.ts`

Além dos checkers booleanos, expõe `symbol` e `fullName` para exibição e agrupa unidades por dimensão física:

```typescript
get symbol(): string   { /* 'un', 'kg', 'm', 'L', 'm²', ... */ }
get fullName(): string { /* 'Unidades', 'Quilogramas', 'Metros', ... */ }
get isWeightBased(): boolean  { return this.unit === 'KILOGRAMS' || this.unit === 'GRAMS'; }
get isVolumeBased(): boolean  { return this.unit === 'LITERS' || this.unit === 'MILLILITERS'; }
get isCountable(): boolean    { return ['UNITS', 'PAIRS', 'BOXES', 'PACKS'].includes(this.unit); }
```

#### `Slug` — `src/entities/stock/value-objects/slug.ts`

Gera slugs URL-safe a partir de texto arbitrário. Possui factory method secundário `createFromText()` com normalização completa:

```typescript
static create(slug: string): Slug                           // wrapping simples
static createFromText(text: string): Slug                   // normaliza acentos, espaços, caracteres especiais
static createUniqueFromText(baseText: string, suffix: string): Slug  // base + sufixo único
static isValid(slug: string): boolean                       // valida formato final
```

#### `SKU` — `src/entities/stock/value-objects/sku.ts`

Value Object com lógica assíncrona: o factory `generateFromName()` consulta o repositório para garantir unicidade, adicionando contador numérico se necessário:

```typescript
static create(value: string): SKU                          // síncrono, apenas validação básica
static async generateFromName(
  name: string,
  variantsRepository: VariantsRepository,
  tenantId?: string,
): Promise<SKU>                                            // normaliza, deduplica com contador
```

#### `AbsenceStatus` — `src/entities/hr/value-objects/absence-status.ts`

O mais completo entre os status VOs: além dos checkers, define as **transições de estado permitidas** como métodos de domínio:

```typescript
// Factory methods nomeados (alternativa ao create genérico):
static pending(): AbsenceStatus
static approved(): AbsenceStatus
static rejected(): AbsenceStatus

// Checkers de transição:
canBeApproved(): boolean  { return this._value === 'PENDING'; }
canBeRejected(): boolean  { return this._value === 'PENDING'; }
canBeCancelled(): boolean { return ['PENDING', 'APPROVED'].includes(this._value); }
canStartProgress(): boolean { return this._value === 'APPROVED'; }
canBeCompleted(): boolean { return this._value === 'IN_PROGRESS'; }

// Agrupamentos:
isActive(): boolean     { return ['PENDING', 'APPROVED', 'IN_PROGRESS'].includes(this._value); }
isFinalized(): boolean  { return ['REJECTED', 'CANCELLED', 'COMPLETED'].includes(this._value); }
```

#### `BoletoBarcode` — `src/entities/finance/value-objects/boleto-barcode.ts`

Value Object de alta complexidade: encapsula toda a lógica de parsing, validação (Mod10/Mod11) e conversão entre código de barras (44 dígitos) e linha digitável (47 dígitos):

```typescript
static fromBarcode(input: string): BoletoBarcode | null
static fromDigitLine(input: string): BoletoBarcode | null
static parse(input: string): BoletoBarcode | null   // detecta o formato automaticamente

get bankCode(): string
get bankName(): string   // resolve nome do banco pelo código
get dueDate(): Date      // calcula a partir do fator de vencimento
get amount(): number     // converte centavos para reais

toBarcode(): string
toDigitLine(): string
toResult(): BoletoParseResult
```

#### `ZoneLayout` e `ZoneStructure` — `src/entities/stock/value-objects/`

Value Objects compostos que encapsulam o layout visual e a estrutura física de zonas de armazém. `ZoneLayout` implementa o padrão **wither** (métodos `with*`) para "mutação" imutável:

```typescript
// ZoneLayout — wither pattern (retorna nova instância)
withUpdatedAislePosition(aisleNumber: number, position: Partial<AislePosition>): ZoneLayout
withAddedAnnotation(annotation: LayoutAnnotation): ZoneLayout
withRemovedAnnotation(annotationId: string): ZoneLayout
withCanvasSize(width: number, height: number): ZoneLayout

// ZoneStructure — composta (contém CodePattern)
get codePattern(): CodePattern    // Value Object encapsulado
get totalBins(): number           // computado com base nas configurações
generateBinData(warehouseCode, zoneCode): Array<{ address, aisle, shelf, position }>
```

---

## Immutability Patterns

### Value Objects são imutáveis

A imutabilidade é garantida por três mecanismos:

1. **Propriedade `private readonly`**: impede reassignment direto do campo interno.
2. **Construtor `private`**: impede criação de novas instâncias fora da classe.
3. **Ausência de setters**: nenhum método altera o estado interno.

```typescript
export class ItemStatus {
  private readonly status: ItemStatusValue;  // readonly

  private constructor(status: ItemStatusValue) {  // private
    this.status = status;
  }

  // Sem setters — para "mudar" o status, cria-se uma nova instância:
  static create(status: ItemStatusValue): ItemStatus {
    return new ItemStatus(status);
  }
}
```

Para VOs com estruturas mais ricas (`ZoneLayout`), o padrão **wither** permite "modificações" sem alterar a instância original:

```typescript
// Nunca:
layout.canvasWidth = 800;     // impossível — sem setter

// Sempre:
const newLayout = layout.withCanvasSize(800, 600);  // nova instância
```

### Entidades são mutáveis por design

Entidades representam coisas que mudam ao longo do tempo. A mutabilidade é controlada:

- Campos que nunca mudam (identidade, códigos gerados automaticamente) têm apenas `get`.
- Campos que podem mudar têm `get` + `set` com chamada a `touch()`.
- Campos imutáveis que são VOs são documentados explicitamente no código:

```typescript
get slug(): Slug { return this.props.slug; }
// slug é imutável após criação (gerado automaticamente)

get fullCode(): string { return this.props.fullCode; }
// fullCode é imutável após criação (gerado automaticamente)
```

### Validação em setters de entidade

Alguns setters de entidade também validam antes de aceitar o novo valor:

```typescript
// src/entities/stock/variant.ts
set price(price: number) {
  if (price < 0) throw new Error('Price cannot be negative');
  this.props.price = price;
  this.touch();
}

set profitMargin(profitMargin: number | undefined) {
  if (profitMargin !== undefined && (profitMargin < 0 || profitMargin > 100)) {
    throw new Error('Profit margin must be between 0 and 100');
  }
  this.props.profitMargin = profitMargin;
  this.touch();
}
```

```typescript
// src/entities/stock/item.ts
set currentQuantity(quantity: number) {
  if (quantity < 0) throw new Error('Quantity cannot be negative');
  this.props.currentQuantity = quantity;
  this.touch();
}
```

---

## Module Organization

```
src/entities/
  domain/
    entities.ts          # Classe abstrata Entity<Props>
    unique-entity-id.ts  # UniqueEntityID
    optional.ts          # Tipo utilitário Optional<T, K>
  core/                  # Módulo: autenticação, usuários, tenants
    user.ts
    tenant.ts
    session.ts
    refresh-token.ts
    tenant-user.ts
    tenant-plan.ts
    team.ts, team-member.ts
    plan.ts, plan-module.ts
    label-template.ts
    value-objects/
      email.ts, username.ts, password.ts
      pin.ts, token.ts, url.ts
      ip-address.ts, geo-location.ts, device-info.ts
  stock/                 # Módulo: estoque, produtos, armazéns
    product.ts, variant.ts, item.ts
    template.ts, category.ts, tag.ts
    supplier.ts, manufacturer.ts
    warehouse.ts, zone.ts, bin.ts
    purchase-order.ts, item-movement.ts
    volume.ts, volume-item.ts
    value-objects/
      product-status.ts, item-status.ts
      unit-of-measure.ts, movement-type.ts, volume-status.ts
      sku.ts, slug.ts, cnpj.ts
      code-pattern.ts, zone-layout.ts, zone-structure.ts
  hr/                    # Módulo: RH, colaboradores, folha de pagamento
    employee.ts, department.ts, position.ts
    company.ts, organization/
    payroll.ts, payroll-item.ts
    absence.ts, vacation-period.ts
    time-entry.ts, time-bank.ts, overtime.ts
    work-schedule.ts, bonus.ts, deduction.ts
    value-objects/
      cpf.ts, pis.ts
      employee-status.ts, contract-type.ts, work-regime.ts
      absence-status.ts, absence-type.ts
      payroll-status.ts, payroll-item-type.ts
      vacation-status.ts, time-entry-type.ts
  finance/               # Módulo: finanças, lançamentos, boletos
    finance-entry.ts, bank-account.ts, finance-category.ts
    cost-center.ts, contract.ts
    loan.ts, loan-installment.ts
    consortium.ts, consortium-payment.ts
    recurring-config.ts, finance-attachment.ts
    value-objects/
      boleto-barcode.ts
  sales/                 # Módulo: vendas, clientes, pedidos
  calendar/              # Módulo: agenda, eventos
  email/                 # Módulo: e-mail IMAP/SMTP
  storage/               # Módulo: armazenamento de arquivos
  audit/                 # Módulo: auditoria
  rbac/                  # Módulo: permissões
  notifications/         # Módulo: notificações
  tasks/                 # Módulo: tarefas
  requests/              # Módulo: solicitações
```

Cada módulo com valor objects significativos mantém um `value-objects/` com arquivos individuais por conceito.

---

## Domain Validation Strategy

O sistema usa duas estratégias distintas dependendo do VO:

### Estratégia 1: Lança exceção (`BadRequestError`)

Usada quando o valor inválido é sempre um erro de programação ou entrada do usuário que deve ser rejeitado imediatamente:

```typescript
// Email, Username, Token, Password, Pin, SKU
static create(value: string): Email {
  return new Email(value);  // construtor lança BadRequestError internamente
}
```

### Estratégia 2: Retorna `null`

Usada quando o chamador precisa decidir o que fazer com o valor inválido (ex.: exibir mensagem específica, tentar alternativa):

```typescript
// CNPJ, BoletoBarcode
static create(cnpj: string): CNPJ | null {
  if (!CNPJ.isValid(cleanedCNPJ)) return null;
  return new CNPJ(CNPJ.format(cleanedCNPJ));
}
```

### Estratégia 3: Lança `Error` genérico

Usada em VOs de domínio interno onde o valor inválido indica inconsistência de dados (não entrada do usuário):

```typescript
// CPF, AbsenceStatus
static create(cpf: string): CPF {
  if (!this.isValid(cpf)) throw new Error('CPF inválido');
  return new CPF(cleanCPF);
}
```

---

## Real Examples: From Use Case to Repository

### Criação de um novo Produto

```typescript
// 1. Use Case recebe dados brutos do controller
const product = Product.create({
  tenantId: new UniqueEntityID(tenantId),
  templateId: new UniqueEntityID(templateId),
  name: 'Camiseta Básica',
  slug: Slug.createFromText('Camiseta Básica'),           // "camiseta-basica"
  status: ProductStatus.create('ACTIVE'),
  fullCode: '001.001.0001',
  barcode: generateCode128('001.001.0001'),
  eanCode: generateEAN13('001.001.0001'),
  upcCode: generateUPC('001.001.0001'),
  // attributes, outOfLine: recebem defaults no create()
});

// 2. Entidade criada com invariantes garantidas
product.canBeSold         // true (status.canBeSold && !isDeleted)
product.status.isActive   // true
product.slug.value        // "camiseta-basica"

// 3. Alterar estado via métodos de negócio
product.deactivate()      // internamente: this.status = ProductStatus.create('INACTIVE')
product.canBeSold         // false (status mudou)
```

### Reconstrução a partir do banco de dados (Mapper)

```typescript
// src/mappers/stock/product/product-prisma-to-domain.ts
export function productPrismaToDomain(raw: PrismaProduct): Product {
  return Product.create(
    {
      tenantId: new UniqueEntityID(raw.tenant_id),
      name: raw.name,
      slug: Slug.create(raw.slug),
      status: ProductStatus.create(raw.status as ProductStatusValue),
      fullCode: raw.full_code,
      // ...demais campos
      createdAt: raw.created_at,
      updatedAt: raw.updated_at ?? undefined,
      deletedAt: raw.deleted_at ?? undefined,
    },
    new UniqueEntityID(raw.id),  // id passado como segundo argumento
  );
}
```

### Criação de Usuário com Value Objects assíncronos

```typescript
// src/use-cases/core/auth/register-user.ts
const hashedPassword = await Password.create(request.password);  // valida + hasha
const email = Email.create(request.email);                        // valida + normaliza
const username = Username.create(request.username);              // valida + normaliza

const user = User.create({
  email,
  username,
  password: hashedPassword,
  profile: null,
  // failedLoginAttempts, forcePasswordReset, etc: recebem defaults
});
```

---

## Rules

### Quando usar Entity

- O conceito tem identidade própria (cada instância é única e rastreável).
- O objeto tem ciclo de vida: é criado, sofre mutações ao longo do tempo e pode ser removido.
- Exemplos: `Product`, `User`, `Item`, `FinanceEntry`, `CalendarEvent`.

### Quando usar Value Object

- A igualdade entre dois objetos é definida pelos seus valores, não por identidade.
- O conceito deve ser imutável: "mudar" significa criar uma nova instância.
- O conceito encapsula regras de formato, validação ou cálculo de um único conceito de domínio.
- Exemplos: `Email`, `CPF`, `ItemStatus`, `UnitOfMeasure`, `Slug`, `BoletoBarcode`.

### Armadilhas comuns

**Não instanciar diretamente com `new`:**
```typescript
// Errado — construtor protegido/privado
const product = new Product(props, id);

// Correto — factory method
const product = Product.create(props, id);
```

**Não comparar entidades por valor de atributos:**
```typescript
// Errado — compara referências de objeto, sempre false
if (product1 === product2) { ... }

// Correto — usa equals() que compara por UniqueEntityID
if (product1.equals(product2)) { ... }
```

**Não comparar Value Objects por referência:**
```typescript
// Errado
if (email1 === email2) { ... }

// Correto
if (email1.equals(email2)) { ... }
```

**Não passar strings brutas onde se espera Value Object:**
```typescript
// Errado — perde as validações e os getters computados
product.props.status = 'ACTIVE' as any;

// Correto — cria o VO que valida e expõe os comportamentos
product.status = ProductStatus.create('ACTIVE');
```

**Não armazenar o valor primitivo do VO em vez do VO:**
```typescript
// Errado — perde canBeSold, requiresAttention, etc.
interface ProductProps {
  status: string;
}

// Correto
interface ProductProps {
  status: ProductStatus;
}
```

**Não esquecer de `touch()` em novos setters:**
```typescript
// Errado — updatedAt não é atualizado, dado stale no banco
set name(name: string) {
  this.props.name = name;
}

// Correto
set name(name: string) {
  this.props.name = name;
  this.touch();
}
```

---

## Files

### Base do domínio

| Arquivo | Descrição |
|---------|-----------|
| `src/entities/domain/entities.ts` | Classe abstrata `Entity<Props>` |
| `src/entities/domain/unique-entity-id.ts` | `UniqueEntityID` |
| `src/entities/domain/optional.ts` | Tipo utilitário `Optional<T, K>` |

### Entidades com implementação mais completa para referência

| Arquivo | Destaques |
|---------|-----------|
| `src/entities/stock/product.ts` | `touch()`, campos imutáveis, propriedades computadas, métodos de negócio |
| `src/entities/stock/item.ts` | Validação em setter (`currentQuantity`, `unitCost`), `canBeSold` composto |
| `src/entities/stock/variant.ts` | Validação múltipla em setters (`price`, `profitMargin`, limites de estoque) |
| `src/entities/core/user.ts` | VOs assíncronos (`Password`, `Pin`), `isBlocked` com dayjs |
| `src/entities/core/tenant.ts` | `TenantStatus` como union type (sem VO), `generateSlug()` estático |

### Value Objects de referência por complexidade

| Arquivo | Complexidade | Destaque |
|---------|-------------|----------|
| `src/entities/stock/value-objects/item-status.ts` | Simples | Padrão mínimo completo |
| `src/entities/core/value-objects/email.ts` | Simples | Normalização + validação |
| `src/entities/hr/value-objects/cpf.ts` | Média | Algoritmo verificador + `ValueObject<T>` |
| `src/entities/stock/value-objects/cnpj.ts` | Média | Retorna `null` em vez de lançar |
| `src/entities/core/value-objects/password.ts` | Alta | Factory assíncrono, bcrypt |
| `src/entities/hr/value-objects/absence-status.ts` | Alta | Transições de estado completas |
| `src/entities/stock/value-objects/zone-layout.ts` | Alta | Wither pattern, VO composto |
| `src/entities/finance/value-objects/boleto-barcode.ts` | Muito alta | Parsing Mod10/Mod11, conversão de formato |

## Audit History

| Date | Dimension | Score | Report |
|------|-----------|-------|--------|
| 2026-03-10 | Documentação inicial | — | Criado com base na análise do código-fonte |
