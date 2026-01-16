# Guia de Contribuição

Obrigado por considerar contribuir com o OpenSea-API! Este documento fornece diretrizes para contribuições.

## Código de Conduta

- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para o projeto
- Mostre empatia com outros contribuidores

## Como Contribuir

### Reportando Bugs

1. Verifique se o bug já não foi reportado nas [Issues](https://github.com/seu-org/opensea-api/issues)
2. Se não encontrar, abra uma nova issue com:
   - Título claro e descritivo
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Versão do Node.js e sistema operacional
   - Logs de erro (se aplicável)

### Sugerindo Features

1. Abra uma issue com a tag `enhancement`
2. Descreva a feature desejada
3. Explique o caso de uso
4. Considere impactos na arquitetura existente

### Enviando Pull Requests

1. Fork o repositório
2. Crie uma branch a partir de `main`:
   ```bash
   git checkout -b feature/minha-feature
   ```
3. Faça suas alterações seguindo os padrões do projeto
4. Escreva/atualize testes
5. Commit usando conventional commits:
   ```bash
   git commit -m "feat: adiciona endpoint de criação de produto"
   ```
6. Push para sua branch:
   ```bash
   git push origin feature/minha-feature
   ```
7. Abra um Pull Request

## Padrões de Código

### Arquitetura

Siga os princípios da Clean Architecture:

```
src/
├── entities/       # Domain Layer - Entidades e Value Objects
├── use-cases/      # Application Layer - Casos de uso
├── repositories/   # Infrastructure Layer - Acesso a dados
└── http/           # Interface Layer - Controllers HTTP
```

### TypeScript

- Use tipos explícitos (evite `any`)
- Prefira interfaces para contratos públicos
- Use `readonly` quando apropriado
- Exporte apenas o necessário

```typescript
// Bom
interface CreateUserRequest {
  readonly email: string
  readonly password: string
}

// Evitar
const createUser = (data: any) => { ... }
```

### Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Arquivos | kebab-case | `create-product.ts` |
| Classes | PascalCase | `CreateProductUseCase` |
| Funções | camelCase | `createProduct()` |
| Constantes | UPPER_SNAKE | `MAX_PAGE_SIZE` |
| Interfaces | PascalCase | `ProductRepository` |

### Estrutura de Use Case

```typescript
// src/use-cases/stock/products/create-product.ts

interface CreateProductRequest {
  name: string
  sku: string
}

interface CreateProductResponse {
  product: Product
}

export class CreateProductUseCase {
  constructor(
    private productsRepository: ProductsRepository,
  ) {}

  async execute(
    request: CreateProductRequest,
  ): Promise<CreateProductResponse> {
    // Implementação
  }
}
```

### Estrutura de Controller

```typescript
// src/http/controllers/stock/products/v1-create-product.controller.ts

export async function v1CreateProductController(
  app: FastifyInstance,
) {
  app.post(
    '/v1/products',
    {
      schema: {
        tags: ['Products'],
        summary: 'Create a new product',
        body: createProductBodySchema,
        response: {
          201: productResponseSchema,
        },
      },
      preHandler: [verifyJwt, verifyPermission('stock.products.create')],
    },
    async (request, reply) => {
      // Implementação
    },
  )
}
```

## Testes

### Testes Unitários

- Teste cada use case isoladamente
- Use repositórios in-memory
- Cubra casos de sucesso e erro
- Nome do arquivo: `*.spec.ts`

```typescript
describe('CreateProductUseCase', () => {
  let sut: CreateProductUseCase
  let productsRepository: InMemoryProductsRepository

  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository()
    sut = new CreateProductUseCase(productsRepository)
  })

  it('should create a product', async () => {
    const result = await sut.execute({
      name: 'Test Product',
      sku: 'TEST-001',
    })

    expect(result.product).toBeDefined()
  })

  it('should not create product with duplicate SKU', async () => {
    // ...
  })
})
```

### Testes E2E

- Teste endpoints HTTP completos
- Use banco de dados de teste (via Docker)
- Nome do arquivo: `*.e2e.spec.ts`

```typescript
describe('Create Product (e2e)', () => {
  it('should create a product', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      permissions: ['stock.products.create'],
    })

    const response = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test', sku: 'TEST-001' })

    expect(response.status).toBe(201)
  })
})
```

### Executando Testes

```bash
# Unitários
npm test

# E2E
npm run test:e2e

# Cobertura
npm run test:coverage
```

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos

| Tipo | Descrição |
|------|-----------|
| `feat` | Nova feature |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `style` | Formatação |
| `refactor` | Refatoração |
| `test` | Testes |
| `chore` | Manutenção |

### Exemplos

```bash
feat(stock): add product creation endpoint
fix(auth): correct token expiration calculation
docs: update API documentation
test(hr): add employee use case tests
refactor(rbac): extract permission service
```

## Branches

```
main                    # Produção
├── develop             # Desenvolvimento
├── feature/xxx         # Novas features
├── fix/xxx             # Correções
├── refactor/xxx        # Refatorações
└── release/x.x.x       # Releases
```

## Pull Request

### Checklist

- [ ] Código segue os padrões do projeto
- [ ] Testes escritos e passando
- [ ] Documentação atualizada (se necessário)
- [ ] Sem conflitos com `main`
- [ ] Descrição clara das mudanças

### Template

```markdown
## Descrição
Breve descrição das mudanças.

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Como Testar
1. Passo 1
2. Passo 2

## Screenshots (se aplicável)

## Checklist
- [ ] Testes passando
- [ ] Documentação atualizada
```

## Dúvidas

- Abra uma issue com a tag `question`
- Consulte a [documentação](docs/ARCHITECTURE.md)
- Revise os [ADRs](docs/adr/) para decisões arquiteturais

---

Obrigado por contribuir!
