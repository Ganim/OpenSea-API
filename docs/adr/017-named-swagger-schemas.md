# ADR-017: Named Swagger Schemas

## Status: Accepted
## Date: 2026-03-10

## Context

O OpenSea usa `fastify-type-provider-zod` para converter schemas Zod em JSON Schema para a especificação OpenAPI. Sem configuração adicional, cada schema Zod é convertido **inline** onde é referenciado, resultando em uma especificação OpenAPI com definições duplicadas e sem `$ref`.

Isso gerava dois problemas práticos:

1. **Especificação OpenAPI sem `$ref`**: Ferramentas de geração de client (ex: `swagger-typescript-api`, `openapi-generator`) produzem tipos anônimos em vez de interfaces nomeadas. O frontend precisava de ~364KB de tipos gerados que eram majoritariamente `any` por ausência de schemas nomeados. Esse arquivo foi removido em março de 2026 exatamente por esse motivo.

2. **Documentação ilegível**: O Swagger UI exibia schemas inlines repetidos em vez de referências reutilizáveis. Um schema `Product` aparecia completo em `GET /products`, `POST /products`, `GET /products/:id`, etc., dificultando a leitura.

Foram avaliadas as seguintes abordagens:

1. **Manter schemas inline**: Simples mas produz documentação e client gerado de baixa qualidade.
2. **Registrar schemas manualmente no registro global do Zod**: Usa a API `z.globalRegistry.add(schema, { id })` disponível no Zod 4+. Não requer alteração dos schemas existentes.
3. **Reescrever schemas com `z.object().openapi()`** (zod-openapi): Requer migração de todos os schemas, alto custo.

## Decision

Utilizar o **registro global do Zod** (`z.globalRegistry`) para registrar schemas chave com um `id` único, sem modificar os schemas originais.

### Arquivo de Registro

`src/http/schemas/register-named-schemas.ts` é importado uma única vez durante o startup, antes do registro das rotas:

```typescript
// src/app.ts
if (shouldEnableSwagger) {
  require('./http/schemas/register-named-schemas');
  app.register(swagger, { ... });
}
```

### Schemas Registrados (Março 2026)

| ID OpenAPI | Schema Zod | Módulo |
|-----------|-----------|--------|
| `PaginationMeta` | Definido inline no arquivo | Comum |
| `ErrorResponse` | Definido inline no arquivo | Comum |
| `PaginationQuery` | `paginationSchema` | Comum |
| `CreateProduct` | `createProductSchema` | Stock |
| `UpdateProduct` | `updateProductSchema` | Stock |
| `Product` | `productResponseSchema` | Stock |
| `CreateVariant` | `createVariantSchema` | Stock |
| `Variant` | `variantResponseSchema` | Stock |
| `Item` | `itemResponseSchema` | Stock |
| `CreateFinanceEntry` | `createFinanceEntrySchema` | Finance |
| `FinanceEntry` | `financeEntryResponseSchema` | Finance |
| `BankAccount` | `bankAccountResponseSchema` | Finance |
| `FinanceCategory` | `financeCategoryResponseSchema` | Finance |
| `CreateEmployee` | `createEmployeeSchema` | HR |
| `Employee` | `employeeResponseSchema` | HR |
| `Department` | `departmentResponseSchema` | HR |
| `CreateCalendarEvent` | `createCalendarEventSchema` | Calendar |
| `CalendarEvent` | `calendarEventResponseSchema` | Calendar |
| `StorageFile` | `storageFileResponseSchema` | Storage |
| `StorageFolder` | `storageFolderResponseSchema` | Storage |
| `Customer` | `customerResponseSchema` | Sales |
| `SalesOrder` | `salesOrderResponseSchema` | Sales |
| `User` | `userResponseSchema` | Auth |
| `Session` | `sessionResponseSchema` | Auth |

### Mecanismo de Registro

```typescript
// Registrar um schema existente sem modificá-lo
import { productResponseSchema } from './stock/products/product.schema';
z.globalRegistry.add(productResponseSchema, { id: 'Product' });
```

Após o registro, `fastify-type-provider-zod` (via `jsonSchemaTransform`) gera `$ref: '#/components/schemas/Product'` em vez de repetir o schema inline em cada rota que o usa.

### Isolamento de Ambiente

O registro e o Swagger completo são carregados **somente quando necessário**:
- Em testes: **nunca** (o Swagger compila todos os schemas Zod em JSON Schema, o que levava 5+ minutos no Windows)
- Em desenvolvimento: apenas com `ENABLE_SWAGGER=true` no `.env`
- Em produção: sempre habilitado

```typescript
const shouldEnableSwagger =
  !isTestEnv &&
  (env.NODE_ENV === 'production' || process.env.ENABLE_SWAGGER === 'true');
```

### Adicionando Novos Schemas

Para registrar um novo schema após adicionar um módulo ou entidade:

1. Importe o schema Zod de resposta do módulo.
2. Adicione `z.globalRegistry.add(schema, { id: 'NomeDescritivo' })` na seção correspondente de `register-named-schemas.ts`.
3. O ID deve ser único globalmente (não pode repetir entre módulos).

## Consequences

**Positive:**
- A especificação OpenAPI gerada contém `$ref` em vez de schemas inline duplicados, habilitando geração de client com tipos nomeados.
- O Swagger UI exibe a lista `Schemas` com todas as entidades nomeadas, melhorando a navegação da documentação.
- Os schemas Zod originais não são modificados — o registro é puramente aditivo.
- O isolamento por ambiente garante que testes não sofram com o overhead de compilação do Swagger.

**Negative:**
- O arquivo `register-named-schemas.ts` precisa ser atualizado manualmente ao adicionar novos módulos ou entidades relevantes — não há registro automático.
- O registro usa `require()` síncrono no startup em vez de `import` estático, o que impede que o compilador TypeScript detecte erros de importação nessa linha.
- Schemas registrados sem um `id` único globalmente causam conflito silencioso (o segundo sobrescreve o primeiro no registry). É necessário disciplina de nomenclatura.
- O benefício de geração de client é parcial: apenas schemas explicitamente registrados geram `$ref`. Schemas de endpoints que usam schemas não registrados continuam gerando definições inline.
