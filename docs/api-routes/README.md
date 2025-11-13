# Documentação de Rotas da API - OpenSea

Esta documentação fornece uma referência completa de todas as rotas disponíveis na API OpenSea, organizada por módulos para facilitar o desenvolvimento do front-end.

## Índice

### Core (Autenticação e Usuários)
- [Auth](./core-auth.md) - Autenticação, registro e recuperação de senha
- [Me](./core-me.md) - Gerenciamento do perfil do usuário autenticado
- [Users](./core-users.md) - Administração de usuários (Admin/Manager)
- [Sessions](./core-sessions.md) - Gerenciamento de sessões

### Stock (Gestão de Estoque)
- [Products](./stock-products.md) - Produtos
- [Variants](./stock-variants.md) - Variantes de produtos
- [Items](./stock-items.md) - Itens físicos em estoque
- [Item Movements](./stock-item-movements.md) - Movimentações de itens
- [Categories](./stock-categories.md) - Categorias de produtos
- [Manufacturers](./stock-manufacturers.md) - Fabricantes
- [Suppliers](./stock-suppliers.md) - Fornecedores
- [Locations](./stock-locations.md) - Locais de armazenamento
- [Tags](./stock-tags.md) - Tags/Etiquetas
- [Templates](./stock-templates.md) - Templates de atributos
- [Purchase Orders](./stock-purchase-orders.md) - Ordens de compra

### Sales (Vendas)
- [Customers](./sales-customers.md) - Clientes
- [Sales Orders](./sales-sales-orders.md) - Pedidos de venda
- [Comments](./sales-comments.md) - Comentários
- [Variant Promotions](./sales-variant-promotions.md) - Promoções de variantes
- [Item Reservations](./sales-item-reservations.md) - Reservas de itens
- [Notification Preferences](./sales-notification-preferences.md) - Preferências de notificação

### Health
- [Health](./health.md) - Health check da API

## Informações Gerais

### Base URL
```
http://localhost:3333 (desenvolvimento)
```

### Autenticação
A maioria das rotas requer autenticação via Bearer Token no header:
```
Authorization: Bearer {token}
```

### Roles (Permissões)
- **USER**: Usuário comum (acesso básico)
- **MANAGER**: Gerente (pode criar e modificar recursos)
- **ADMIN**: Administrador (acesso total, incluindo exclusão e gerenciamento de usuários)

### Rate Limiting
A API implementa rate limiting em diferentes níveis:
- **Public**: Rotas públicas (mais restritivo)
- **Auth**: Rotas de autenticação (proteção contra brute force)
- **Query**: Rotas de consulta (leitura)
- **Mutation**: Rotas de mutação (criação/atualização)
- **Admin**: Rotas administrativas (limite elevado)

### Formato de Resposta
Todas as respostas seguem o formato JSON:

**Sucesso:**
```json
{
  "data": { ... }
}
```

**Erro:**
```json
{
  "message": "Mensagem de erro"
}
```

### Códigos de Status HTTP
- `200`: OK - Requisição bem-sucedida
- `201`: Created - Recurso criado com sucesso
- `400`: Bad Request - Dados inválidos
- `401`: Unauthorized - Não autenticado
- `403`: Forbidden - Sem permissão
- `404`: Not Found - Recurso não encontrado
- `500`: Internal Server Error - Erro interno do servidor

### Paginação
Rotas de listagem geralmente suportam parâmetros de paginação:
- `page` (padrão: 1)
- `limit` (padrão: 20, máximo: 100)
- `search` (busca textual)
- `sortBy` (campo para ordenação)
- `sortOrder` (`asc` ou `desc`, padrão: `desc`)

## Gerado em
12 de novembro de 2025
