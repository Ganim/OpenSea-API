# Referência Rápida de Rotas da API

## Core - Autenticação e Usuários

### Auth
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| POST | `/v1/auth/login/password` | Login com email e senha | Pública |
| POST | `/v1/auth/register/password` | Registro de novo usuário | Pública |
| POST | `/v1/auth/send/password` | Solicitar token de recuperação | Pública |
| POST | `/v1/auth/reset/password` | Resetar senha com token | Pública |

### Me (Perfil)
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/me` | Obter meu perfil | Autenticado |
| PATCH | `/v1/me` | Atualizar meu perfil | Autenticado |
| PATCH | `/v1/me/email` | Alterar meu email | Autenticado |
| PATCH | `/v1/me/username` | Alterar meu username | Autenticado |
| PATCH | `/v1/me/password` | Alterar minha senha | Autenticado |
| DELETE | `/v1/me` | Excluir minha conta | Autenticado |

### Users (Administração)
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/users` | Listar todos os usuários | MANAGER |
| GET | `/v1/users/:userId` | Obter usuário por ID | Autenticado |
| GET | `/v1/users/email/:email` | Obter usuário por email | Autenticado |
| GET | `/v1/users/username/:username` | Obter usuário por username | Autenticado |
| GET | `/v1/users/role/:role` | Listar usuários por role | ADMIN |
| GET | `/v1/users/online` | Listar usuários online | Autenticado |
| POST | `/v1/users` | Criar usuário | MANAGER |
| PATCH | `/v1/users/:userId/email` | Alterar email | ADMIN |
| PATCH | `/v1/users/:userId/username` | Alterar username | ADMIN |
| PATCH | `/v1/users/:userId/password` | Alterar senha | ADMIN |
| PATCH | `/v1/users/:userId/role` | Alterar role | ADMIN |
| PATCH | `/v1/users/:userId` | Atualizar perfil | ADMIN |
| DELETE | `/v1/users/:userId` | Excluir usuário | ADMIN |

### Sessions
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/sessions` | Listar minhas sessões | Autenticado |
| GET | `/v1/sessions/active` | Listar sessões ativas | MANAGER |
| GET | `/v1/sessions/user/:userId` | Listar sessões do usuário | MANAGER |
| GET | `/v1/sessions/user/:userId/by-date` | Listar sessões por data | MANAGER |
| POST | `/v1/sessions/refresh` | Renovar sessão | Autenticado |
| POST | `/v1/sessions/logout` | Fazer logout | Autenticado |
| POST | `/v1/sessions/:sessionId/revoke` | Revogar sessão | MANAGER |
| POST | `/v1/sessions/:sessionId/expire` | Expirar sessão | MANAGER |

---

## Stock - Gestão de Estoque

### Products
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/products` | Listar produtos | Autenticado |
| GET | `/v1/products/:productId` | Obter produto por ID | Autenticado |
| POST | `/v1/products` | Criar produto | MANAGER |
| PATCH | `/v1/products/:productId` | Atualizar produto | MANAGER |
| DELETE | `/v1/products/:productId` | Excluir produto | ADMIN |

### Variants
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/variants` | Listar variantes | Autenticado |
| GET | `/v1/variants/:id` | Obter variante por ID | Autenticado |
| POST | `/v1/variants` | Criar variante | MANAGER |
| PATCH | `/v1/variants/:id` | Atualizar variante | MANAGER |
| DELETE | `/v1/variants/:id` | Excluir variante | ADMIN |

### Items
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/items` | Listar itens | Autenticado |
| GET | `/v1/items/:itemId` | Obter item por ID | Autenticado |
| POST | `/v1/items/entry` | Registrar entrada | MANAGER |
| POST | `/v1/items/exit` | Registrar saída | MANAGER |
| POST | `/v1/items/transfer` | Transferir item | MANAGER |

### Item Movements
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/item-movements` | Listar movimentações | Autenticado |

### Categories
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/categories` | Listar categorias | Autenticado |
| GET | `/v1/categories/:id` | Obter categoria por ID | Autenticado |
| POST | `/v1/categories` | Criar categoria | MANAGER |
| PATCH | `/v1/categories/:id` | Atualizar categoria | MANAGER |
| DELETE | `/v1/categories/:id` | Excluir categoria | ADMIN |

### Manufacturers
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/manufacturers` | Listar fabricantes | Autenticado |
| GET | `/v1/manufacturers/:id` | Obter fabricante por ID | Autenticado |
| POST | `/v1/manufacturers` | Criar fabricante | MANAGER |
| PATCH | `/v1/manufacturers/:id` | Atualizar fabricante | MANAGER |
| DELETE | `/v1/manufacturers/:id` | Excluir fabricante | ADMIN |

### Suppliers
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/suppliers` | Listar fornecedores | Autenticado |
| GET | `/v1/suppliers/:id` | Obter fornecedor por ID | Autenticado |
| POST | `/v1/suppliers` | Criar fornecedor | MANAGER |
| PATCH | `/v1/suppliers/:id` | Atualizar fornecedor | MANAGER |
| DELETE | `/v1/suppliers/:id` | Excluir fornecedor | ADMIN |

### Locations
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/locations` | Listar locais | Autenticado |
| GET | `/v1/locations/:id` | Obter local por ID | Autenticado |
| POST | `/v1/locations` | Criar local | MANAGER |
| PATCH | `/v1/locations/:id` | Atualizar local | MANAGER |
| DELETE | `/v1/locations/:id` | Excluir local | ADMIN |

### Tags
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/tags` | Listar tags | Autenticado |
| GET | `/v1/tags/:id` | Obter tag por ID | Autenticado |
| POST | `/v1/tags` | Criar tag | MANAGER |
| PATCH | `/v1/tags/:id` | Atualizar tag | MANAGER |
| DELETE | `/v1/tags/:id` | Excluir tag | ADMIN |

### Templates
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/templates` | Listar templates | Autenticado |
| GET | `/v1/templates/:id` | Obter template por ID | Autenticado |
| POST | `/v1/templates` | Criar template | MANAGER |
| PATCH | `/v1/templates/:id` | Atualizar template | MANAGER |
| DELETE | `/v1/templates/:id` | Excluir template | ADMIN |

### Purchase Orders
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/purchase-orders` | Listar ordens | Autenticado |
| GET | `/v1/purchase-orders/:id` | Obter ordem por ID | Autenticado |
| POST | `/v1/purchase-orders` | Criar ordem | MANAGER |
| PATCH | `/v1/purchase-orders/:id/status` | Atualizar status | MANAGER |

---

## Sales - Vendas

### Customers
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/customers` | Listar clientes | Autenticado |
| GET | `/v1/customers/:id` | Obter cliente por ID | Autenticado |
| POST | `/v1/customers` | Criar cliente | Autenticado |
| PATCH | `/v1/customers/:id` | Atualizar cliente | Autenticado |
| DELETE | `/v1/customers/:id` | Excluir cliente | ADMIN |

### Sales Orders
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/sales-orders` | Listar pedidos | Autenticado |
| GET | `/v1/sales-orders/:id` | Obter pedido por ID | Autenticado |
| POST | `/v1/sales-orders` | Criar pedido | Autenticado |
| PATCH | `/v1/sales-orders/:id/status` | Atualizar status | Autenticado |
| POST | `/v1/sales-orders/:id/cancel` | Cancelar pedido | Autenticado |

### Comments
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/comments` | Listar comentários | Autenticado |
| GET | `/v1/comments/:id` | Obter comentário por ID | Autenticado |
| POST | `/v1/comments` | Criar comentário | Autenticado |
| PATCH | `/v1/comments/:id` | Atualizar comentário | Autenticado |
| DELETE | `/v1/comments/:id` | Excluir comentário | Autenticado |

### Variant Promotions
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/variant-promotions` | Listar promoções | Autenticado |
| GET | `/v1/variant-promotions/:id` | Obter promoção por ID | Autenticado |
| POST | `/v1/variant-promotions` | Criar promoção | Autenticado |
| PATCH | `/v1/variant-promotions/:id` | Atualizar promoção | Autenticado |
| DELETE | `/v1/variant-promotions/:id` | Excluir promoção | Autenticado |

### Item Reservations
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/item-reservations` | Listar reservas | Autenticado |
| GET | `/v1/item-reservations/:id` | Obter reserva por ID | Autenticado |
| POST | `/v1/item-reservations` | Criar reserva | Autenticado |
| POST | `/v1/item-reservations/:id/release` | Liberar reserva | Autenticado |

### Notification Preferences
| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/v1/notification-preferences/user/:userId` | Listar preferências | Autenticado |
| POST | `/v1/notification-preferences` | Criar preferência | Autenticado |
| PATCH | `/v1/notification-preferences/:id` | Atualizar preferência | Autenticado |
| DELETE | `/v1/notification-preferences/:id` | Excluir preferência | Autenticado |

---

## Health

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/health` | Health check | Pública |

---

**Total de Rotas:** 100+  
**Base URL:** `http://localhost:3333`  
**Versão da API:** v1  
**Última Atualização:** 12 de novembro de 2025
