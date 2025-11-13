# Documentação da API OpenSea - Resumo Executivo

## 📋 Visão Geral

Esta documentação completa fornece todas as informações necessárias para integrar o front-end com a API OpenSea. A API é organizada em três módulos principais:

- **Core**: Autenticação, usuários e sessões
- **Stock**: Gestão de estoque e produtos
- **Sales**: Vendas, clientes e pedidos

**Total de Rotas**: 100+  
**Base URL**: `http://localhost:3333`  
**Versão**: v1  
**Formato**: REST API com JSON

---

## 📚 Arquivos de Documentação

### Documentação Geral
- **[README.md](./README.md)** - Índice principal e informações gerais
- **[ROUTES-REFERENCE.md](./ROUTES-REFERENCE.md)** - Referência rápida de todas as rotas
- **[FRONTEND-GUIDE.md](./FRONTEND-GUIDE.md)** - Guia completo de integração front-end
- **[TYPESCRIPT-TYPES.md](./TYPESCRIPT-TYPES.md)** - Tipos TypeScript completos

### Core (Autenticação e Usuários)
- **[core-auth.md](./core-auth.md)** - Login, registro e recuperação de senha
- **[core-me.md](./core-me.md)** - Gerenciamento do perfil do usuário
- **[core-users.md](./core-users.md)** - Administração de usuários (ADMIN/MANAGER)
- **[core-sessions.md](./core-sessions.md)** - Gerenciamento de sessões

### Stock (Gestão de Estoque)
- **[stock-products.md](./stock-products.md)** - CRUD de produtos
- **[stock-variants.md](./stock-variants.md)** - Variantes de produtos
- **[stock-items.md](./stock-items.md)** - Itens físicos e movimentações
- **[stock-item-movements.md](./stock-item-movements.md)** - Histórico de movimentações
- **[stock-categories.md](./stock-categories.md)** - Categorias de produtos
- **[stock-outros.md](./stock-outros.md)** - Fabricantes, fornecedores, locais, tags, templates e ordens de compra

### Sales (Vendas)
- **[sales-customers.md](./sales-customers.md)** - Gerenciamento de clientes
- **[sales-sales-orders.md](./sales-sales-orders.md)** - Pedidos de venda
- **[sales-outros.md](./sales-outros.md)** - Comentários, promoções, reservas e notificações

### Outros
- **[health.md](./health.md)** - Health check da API

---

## 🚀 Quick Start

### 1. Autenticação

```typescript
// Login
const response = await fetch('http://localhost:3333/v1/auth/login/password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@example.com',
    password: 'senha123'
  })
});

const { token, refreshToken, user } = await response.json();
localStorage.setItem('token', token);
```

### 2. Requisição Autenticada

```typescript
const response = await fetch('http://localhost:3333/v1/products', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { products } = await response.json();
```

### 3. Criar Recurso

```typescript
const response = await fetch('http://localhost:3333/v1/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Novo Produto',
    code: 'PROD-001',
    unitOfMeasure: 'UNITS',
    templateId: 'template-uuid'
  })
});

const { product } = await response.json();
```

---

## 🔐 Autenticação e Permissões

### Tipos de Acesso

| Role | Descrição | Permissões |
|------|-----------|------------|
| **Público** | Sem autenticação | Login, registro, recuperação de senha, health check |
| **USER** | Usuário comum | Visualizar dados, gerenciar próprio perfil, criar clientes e pedidos |
| **MANAGER** | Gerente | Tudo de USER + criar/editar produtos, estoque, usuários |
| **ADMIN** | Administrador | Acesso total, incluindo exclusões e gerenciamento de roles |

### Headers de Autenticação

```typescript
{
  'Authorization': 'Bearer {token}',
  'Content-Type': 'application/json'
}
```

---

## 📊 Estrutura de Dados Principal

### Produtos (Stock)
```
Template → Product → Variant → Item
```

- **Template**: Define estrutura de atributos
- **Product**: Produto geral (ex: Camiseta)
- **Variant**: Variação específica (ex: Camiseta Azul M)
- **Item**: Unidade física no estoque

### Vendas (Sales)
```
Customer → Sales Order → Sales Order Items
                       → Item Reservations
```

---

## 🔄 Fluxos Comuns

### Fluxo de Compra
1. Cliente faz pedido → `POST /v1/sales-orders`
2. Sistema reserva itens → `POST /v1/item-reservations`
3. Pagamento confirmado → `PATCH /v1/sales-orders/:id/status` (CONFIRMED)
4. Itens são baixados → `POST /v1/items/exit` (movementType: SALE)
5. Pedido enviado → `PATCH /v1/sales-orders/:id/status` (IN_TRANSIT)
6. Pedido entregue → `PATCH /v1/sales-orders/:id/status` (DELIVERED)

### Fluxo de Reposição de Estoque
1. Criar ordem de compra → `POST /v1/purchase-orders`
2. Confirmar com fornecedor → `PATCH /v1/purchase-orders/:id/status` (CONFIRMED)
3. Receber produtos → `PATCH /v1/purchase-orders/:id/status` (RECEIVED)
4. Registrar entrada → `POST /v1/items/entry`

---

## 📝 Convenções da API

### Códigos de Status HTTP
- **200** OK - Sucesso em operações de leitura/atualização
- **201** Created - Recurso criado com sucesso
- **204** No Content - Exclusão bem-sucedida
- **400** Bad Request - Dados inválidos
- **401** Unauthorized - Não autenticado
- **403** Forbidden - Sem permissão
- **404** Not Found - Recurso não encontrado
- **500** Internal Server Error - Erro do servidor

### Formato de Resposta
```typescript
// Sucesso
{
  "data": { ... }
}

// Erro
{
  "message": "Descrição do erro"
}
```

### Paginação
Rotas de listagem suportam:
- `page` (padrão: 1)
- `limit` (padrão: 20, máx: 100)
- `search` (busca textual)
- `sortBy` (campo para ordenação)
- `sortOrder` (asc/desc, padrão: desc)

### Soft Delete
Recursos não são deletados fisicamente, apenas marcados como deletados (`deletedAt`).

---

## 🛠️ Ferramentas Recomendadas

### Para Desenvolvimento
- **TypeScript**: Type safety completo
- **React Query** ou **SWR**: Cache e sincronização de dados
- **Axios**: Cliente HTTP alternativo
- **Zod**: Validação de dados
- **React Hook Form**: Gerenciamento de formulários

### Para Testes
- **Postman** ou **Insomnia**: Testar endpoints
- **Jest**: Testes unitários
- **React Testing Library**: Testes de componentes

---

## 📞 Suporte e Próximos Passos

### Como Usar Esta Documentação

1. **Comece pelo README.md** para entender a estrutura geral
2. **Consulte ROUTES-REFERENCE.md** para ver todas as rotas disponíveis
3. **Use FRONTEND-GUIDE.md** para implementar a integração
4. **Copie TYPESCRIPT-TYPES.md** para o seu projeto
5. **Consulte os arquivos específicos** de cada módulo quando necessário

### Exemplos de Código

Todos os arquivos de documentação incluem:
- ✅ Estrutura de requisição e resposta
- ✅ Exemplos práticos de uso
- ✅ Tratamento de erros
- ✅ Permissões necessárias

### Manutenção

Esta documentação foi gerada em **12 de novembro de 2025** e reflete o estado atual da API. Para atualizações:

1. Verifique os arquivos de schema em `src/http/schemas/`
2. Consulte os controllers em `src/http/controllers/`
3. Revise as rotas em `src/http/routes.ts`

---

## 🎯 Checklist de Integração

- [ ] Configurar cliente HTTP com autenticação
- [ ] Implementar serviço de login/registro
- [ ] Implementar auto-refresh de tokens
- [ ] Criar serviços para cada módulo (products, customers, etc.)
- [ ] Definir tipos TypeScript para todas as entidades
- [ ] Implementar tratamento de erros global
- [ ] Adicionar loading states em requisições
- [ ] Implementar validação no cliente
- [ ] Testar fluxos principais
- [ ] Adicionar cache quando apropriado

---

## 📄 Licença e Contato

**Projeto**: OpenSea-API  
**Repositório**: Ganim/OpenSea-API  
**Branch**: main  
**Documentação gerada**: 12 de novembro de 2025

Para dúvidas ou sugestões sobre a API, consulte o repositório do projeto.

---

**Boa sorte com o desenvolvimento do front-end! 🚀**
