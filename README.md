# 🌊 OpenSea API

Uma API REST completa para gerenciamento de estoque e vendas, construída com **Clean Architecture**, **TypeScript** e **Fastify**.

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Node](https://img.shields.io/badge/Node.js-20+-green)
![Fastify](https://img.shields.io/badge/Fastify-5.4-black)
![Prisma](https://img.shields.io/badge/Prisma-6.14-2D3748)
![Tests](https://img.shields.io/badge/Tests-854%20passing-success)

## 📋 Índice

- [Características](#-características)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Executando o Projeto](#-executando-o-projeto)
- [Testes](#-testes)
- [Documentação da API](#-documentação-da-api)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Módulos](#-módulos)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Tecnologias](#-tecnologias)
- [Licença](#-licença)

---

## ✨ Características

- 🏗️ **Clean Architecture** - Separação clara de responsabilidades
- 🔐 **Autenticação JWT** - Sistema completo com refresh tokens
- 🏢 **Multi-Tenant** - Isolamento por tenant com planos, módulos e feature flags
- 👑 **Central de Gerenciamento** - Painel administrativo para super admins
- 📊 **Gestão de Estoque** - Controle de produtos, variantes, itens e movimentações
- 💰 **Gestão de Vendas** - Pedidos, clientes, promoções e reservas
- 🧪 **Testes Abrangentes** - 569 testes unitários + 285 testes E2E
- 📝 **Documentação Swagger** - OpenAPI 3.0 interativa
- 🔒 **Segurança** - Rate limiting, CORS, validação Zod
- 🐳 **Docker Ready** - Desenvolvimento com Docker Compose
- 🎯 **TypeScript** - Type-safe em todo o código
- 🚀 **Alta Performance** - Fastify + Prisma otimizado

### 🆕 Sprint 2 - Melhorias de Qualidade

**Schemas Centralizados** ✅

- Sistema unificado de validação Zod
- 5 arquivos de schemas (`common`, `user`, `product`, `auth`, `index`)
- Eliminação de duplicação de código inline
- 350+ linhas de schemas reutilizáveis

**Paginação Padronizada** ✅

- 21 endpoints de listagem com paginação
- Parâmetros padrão: `page` (default: 1) e `limit` (default: 20)
- Resposta estruturada com metadados:
  ```json
  {
    "data": [...],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "pages": 5
    }
  }
  ```

**Logger Estruturado** ✅

- Migração de `console.log` para Pino logger
- 5 contextos especializados: `httpLogger`, `dbLogger`, `authLogger`, `errorLogger`, `performanceLogger`
- Logs estruturados em JSON para produção
- Pretty-print no desenvolvimento

**Senhas Fortes** ✅

- Validação rigorosa em todos os endpoints de autenticação
- Requisitos: 8+ caracteres, maiúscula, minúscula, número, caractere especial
- Aplicado em: criação de usuário, mudança de senha, reset de senha

**Health Check Avançado** ✅

- Monitoramento de banco de dados (latência, conectividade)
- Métricas de memória (heap, RSS)
- Uptime e ambiente
- Endpoint: `GET /health`

---

## 🏛️ Arquitetura

O projeto segue os princípios da **Clean Architecture**:

```
┌─────────────────────────────────────────────────┐
│            HTTP Layer (Controllers)             │
│         Fastify + Zod Validation                │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         Application Layer (Use Cases)           │
│              Business Logic                     │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│           Domain Layer (Entities)               │
│         Value Objects + Domain Logic            │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│      Infrastructure Layer (Repositories)        │
│            Prisma + PostgreSQL                  │
└─────────────────────────────────────────────────┘
```

### Padrões Implementados

- **Repository Pattern** - Abstração de acesso a dados
- **DTO Pattern** - Data Transfer Objects para comunicação entre camadas
- **Factory Pattern** - Criação de use cases e entidades
- **Value Objects** - Encapsulamento de lógica de domínio
- **Dependency Injection** - Inversão de dependências

---

## 📦 Pré-requisitos

- **Node.js** 20.x ou superior
- **Docker** & **Docker Compose** (para banco de dados)
- **npm** ou **yarn**

---

## 🚀 Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/Ganim/OpenSea-API.git
cd OpenSea-API
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações (veja [Configuração](#-configuração)).

4. **Inicie o banco de dados**

```bash
docker-compose up -d
```

5. **Execute as migrations**

```bash
npx prisma migrate dev
```

6. **Inicie o servidor**

```bash
npm run dev
```

A API estará disponível em `http://localhost:3333` 🎉

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Ambiente
NODE_ENV=dev

# Servidor
PORT=3333

# Autenticação JWT
JWT_SECRET=sua_chave_secreta_super_segura_aqui

# Banco de Dados PostgreSQL
DATABASE_URL=postgresql://docker:docker@localhost:5432/opensea-db?schema=public

# SMTP (para recuperação de senha)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=seu_usuario_smtp
SMTP_PASS=sua_senha_smtp

# Frontend (CORS)
FRONTEND_URL=http://localhost:3000
```

### Configurações Importantes

- **JWT_SECRET**: Use uma chave forte e única para produção
- **DATABASE_URL**: Ajuste as credenciais do PostgreSQL
- **SMTP**: Configure com um serviço real (Gmail, SendGrid, etc.)

---

## 🏃 Executando o Projeto

### Desenvolvimento

```bash
npm run dev
```

Servidor com hot-reload em `http://localhost:3333`

### Produção

```bash
npm run build
npm start
```

### Docker

```bash
# Iniciar banco de dados
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

---

## 🧪 Testes

### Testes Unitários

```bash
npm run test
```

**569 testes** cobrindo todas as camadas da aplicação.

### Testes E2E

```bash
npm run test:e2e
```

**285 testes** testando os endpoints HTTP completos.

### Watch Mode

```bash
npm run test:watch        # Unitários
npm run test:e2e:watch    # E2E
```

### Cobertura

```bash
npm run test:coverage
```

---

## 📚 Documentação da API

### Swagger UI

Acesse a documentação interativa em:

```
http://localhost:3333/docs
```

### Autenticação

A maioria dos endpoints requer autenticação JWT:

```bash
# 1. Registrar usuário
POST /v1/auth/register/password
{
  "email": "user@example.com",
  "password": "SenhaForte@123"
}

# 2. Fazer login
POST /v1/auth/login/password
{
  "email": "user@example.com",
  "password": "SenhaForte@123"
}

# 3. Usar o token retornado
Authorization: Bearer <seu_token_jwt>
```

### 🎯 Paginação (Sprint 2)

Todos os endpoints de listagem suportam paginação:

```bash
# Listar produtos com paginação
GET /v1/products?page=1&limit=20

# Resposta:
{
  "data": [...],  # Array de produtos
  "meta": {
    "total": 150,    # Total de registros
    "page": 1,       # Página atual
    "limit": 20,     # Itens por página
    "pages": 8       # Total de páginas
  }
}
```

**Parâmetros:**

- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 20, máximo: 100)

**Endpoints com paginação:**

- `GET /v1/users` - Listar usuários
- `GET /v1/products` - Listar produtos
- `GET /v1/variants` - Listar variantes
- `GET /v1/items` - Listar itens de estoque
- `GET /v1/sessions/me` - Minhas sessões
- E mais 16 endpoints!

### 🔐 Senhas Fortes (Sprint 2)

Todos os endpoints de autenticação agora exigem senhas fortes:

**Requisitos:**

- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial

```bash
# ✅ Válido
"SenhaForte@123"
"MyP@ssw0rd!"

# ❌ Inválido
"senha123"     # Sem maiúscula e caractere especial
"SENHA@123"    # Sem minúscula
"SenhaForte"   # Sem número e caractere especial
```

### 📊 Health Check (Sprint 2)

Monitore a saúde da aplicação:

```bash
GET /health

# Resposta:
{
  "status": "ok",
  "timestamp": "2025-01-10T12:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "database": {
    "status": "connected",
    "latency": 15
  },
  "memory": {
    "heapUsed": 45.2,
    "heapTotal": 128.5,
    "rss": 156.8
  }
}
```

---

## 📁 Estrutura do Projeto

```
OpenSea-API/
├── prisma/
│   ├── schema.prisma              # Schema do banco (inclui multi-tenant)
│   ├── seed.ts                    # Seed (superadmin, planos, tenant demo)
│   ├── migrations/                # Histórico de migrations
│   └── vitest-environment-prisma/ # Ambiente de testes
│
├── src/
│   ├── @env/                      # Validação de variáveis de ambiente
│   ├── @errors/                   # Classes de erro customizadas
│   ├── @types/                    # Definições de tipos TypeScript
│   │
│   ├── config/                    # Configurações da aplicação
│   │   ├── auth.ts                # Constantes de autenticação
│   │   └── swagger-tags.ts        # Tags do Swagger
│   │
│   ├── entities/                  # 🎯 DOMAIN LAYER
│   │   ├── core/                  # Entidades de auth + tenant + plan
│   │   ├── sales/                 # Entidades de vendas
│   │   ├── stock/                 # Entidades de estoque
│   │   └── domain/                # Base classes (Entity, ValueObject)
│   │
│   ├── use-cases/                 # 🎯 APPLICATION LAYER
│   │   ├── core/                  # Casos de uso de auth + tenants
│   │   ├── admin/                 # Casos de uso de admin (plans, dashboard)
│   │   ├── sales/                 # Casos de uso de vendas
│   │   └── stock/                 # Casos de uso de estoque
│   │
│   ├── repositories/              # 🎯 INFRASTRUCTURE LAYER
│   │   ├── core/
│   │   │   ├── prisma/            # Implementação Prisma
│   │   │   └── in-memory/         # Implementação para testes
│   │   ├── sales/
│   │   └── stock/
│   │
│   ├── http/                      # 🎯 HTTP LAYER
│   │   ├── controllers/
│   │   │   ├── admin/             # Controllers admin (super admin)
│   │   │   ├── core/              # Controllers auth, me, sessions, tenants
│   │   │   └── ...                # Demais módulos
│   │   ├── middlewares/           # Middlewares (auth, tenant, superadmin)
│   │   └── routes.ts              # Registro de rotas
│   │
│   ├── mappers/                   # Conversores (Entity ↔ DTO ↔ Prisma)
│   ├── services/                  # Serviços (email, tenant-context)
│   ├── utils/                     # Utilitários e helpers
│   ├── lib/                       # Bibliotecas configuradas
│   │
│   ├── app.ts                     # Configuração do Fastify
│   └── server.ts                  # Entry point da aplicação
│
├── docker-compose.yml             # Configuração Docker
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 🧩 Módulos

### Core (Autenticação & Multi-Tenant)

- ✅ Registro de usuários
- ✅ Login com senha
- ✅ JWT + Refresh Tokens (com `isSuperAdmin` e `tenantId`)
- ✅ Recuperação de senha
- ✅ Gestão de sessões
- ✅ Perfis de usuário
- ✅ Controle de acesso (ADMIN, MANAGER, USER)
- ✅ **Multi-Tenant** - Tenants, planos, módulos, feature flags
- ✅ **Seleção de Tenant** - JWT tenant-scoped após seleção
- ✅ **Super Admin** - Usuários com `isSuperAdmin` acessam Central

### Admin (Super Admin)

- ✅ **Dashboard** - Estatísticas do sistema
- ✅ **Gestão de Tenants** - Listar, detalhes, status, plano, feature flags, usuários
- ✅ **Gestão de Planos** - CRUD completo + módulos do sistema
- ✅ **Seed** - Super admin, 4 planos padrão, tenant demo

### Stock (Estoque)

- ✅ **Products** - Catálogo de produtos
- ✅ **Variants** - Variações de produtos (tamanho, cor, etc)
- ✅ **Categories** - Categorias hierárquicas
- ✅ **Manufacturers** - Fabricantes
- ✅ **Suppliers** - Fornecedores
- ✅ **Locations** - Locais de armazenamento
- ✅ **Tags** - Tags para organização
- ✅ **Templates** - Templates de atributos
- ✅ **Items** - Itens individuais em estoque
- ✅ **Item Movements** - Movimentações de estoque
- ✅ **Purchase Orders** - Ordens de compra

### Sales (Vendas)

- ✅ **Customers** - Gestão de clientes
- ✅ **Sales Orders** - Pedidos de venda
- ✅ **Comments** - Comentários em entidades
- ✅ **Variant Promotions** - Promoções de produtos
- ✅ **Item Reservations** - Reservas de estoque
- ✅ **Notification Preferences** - Preferências de notificação

---

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor em modo watch

# Build
npm run build            # Compila TypeScript para JavaScript
npm start                # Inicia servidor em produção

# Testes
npm run test             # Testes unitários
npm run test:e2e         # Testes end-to-end
npm run test:watch       # Testes unitários em watch mode
npm run test:e2e:watch   # Testes E2E em watch mode
npm run test:coverage    # Relatório de cobertura

# Linting
npm run lint             # Verifica problemas no código
npm run lint:fix         # Corrige problemas automaticamente

# Database (Prisma)
npx prisma studio        # Interface visual do banco
npx prisma migrate dev   # Cria e aplica migrations
npx prisma generate      # Gera Prisma Client
```

---

## 🛠️ Tecnologias

### Backend

- **[Fastify](https://fastify.dev/)** - Framework web de alta performance
- **[TypeScript](https://www.typescriptlang.org/)** - Superset JavaScript com tipagem estática
- **[Prisma](https://www.prisma.io/)** - ORM moderno para TypeScript
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional
- **[Zod](https://zod.dev/)** - Validação de schemas TypeScript-first

### Autenticação & Segurança

- **[@fastify/jwt](https://github.com/fastify/fastify-jwt)** - JSON Web Tokens
- **[@fastify/cors](https://github.com/fastify/fastify-cors)** - Cross-Origin Resource Sharing
- **[@fastify/rate-limit](https://github.com/fastify/fastify-rate-limit)** - Rate limiting
- **[@fastify/cookie](https://github.com/fastify/fastify-cookie)** - Cookie parsing
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Hashing de senhas

### Documentação

- **[@fastify/swagger](https://github.com/fastify/fastify-swagger)** - Geração OpenAPI
- **[@fastify/swagger-ui](https://github.com/fastify/fastify-swagger-ui)** - Interface Swagger
- **[swagger-themes](https://www.npmjs.com/package/swagger-themes)** - Temas customizados

### Testes

- **[Vitest](https://vitest.dev/)** - Framework de testes rápido
- **[Supertest](https://github.com/visionmedia/supertest)** - Testes HTTP
- **[@faker-js/faker](https://fakerjs.dev/)** - Geração de dados fake

### Desenvolvimento

- **[tsx](https://github.com/esbuild-kit/tsx)** - Executar TypeScript diretamente
- **[tsup](https://tsup.egoist.dev/)** - Bundler TypeScript
- **[ESLint](https://eslint.org/)** - Linter
- **[Prettier](https://prettier.io/)** - Formatador de código

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- ✅ Siga os princípios da Clean Architecture
- ✅ Escreva testes para novas features
- ✅ Use TypeScript estrito
- ✅ Valide inputs com Zod
- ✅ Documente endpoints no Swagger

---

## 📄 Licença

Este projeto está sob a licença **ISC**.

---

## 👨‍💻 Autor

**Guilherme Ganim**

- GitHub: [@Ganim](https://github.com/Ganim)

---

## 🙏 Agradecimentos

Desenvolvido com base em princípios modernos de arquitetura de software e boas práticas de desenvolvimento.

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Abra uma [issue](https://github.com/Ganim/OpenSea-API/issues)
2. Consulte a [documentação Swagger](http://localhost:3333/docs)
3. Verifique os testes para exemplos de uso

---

**⭐ Se este projeto foi útil, considere dar uma estrela!**
