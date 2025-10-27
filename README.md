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
- 📊 **Gestão de Estoque** - Controle de produtos, variantes, itens e movimentações
- 💰 **Gestão de Vendas** - Pedidos, clientes, promoções e reservas
- 🧪 **Testes Abrangentes** - 569 testes unitários + 285 testes E2E
- 📝 **Documentação Swagger** - OpenAPI 3.0 interativa
- 🔒 **Segurança** - Rate limiting, CORS, validação Zod
- 🐳 **Docker Ready** - Desenvolvimento com Docker Compose
- 🎯 **TypeScript** - Type-safe em todo o código
- 🚀 **Alta Performance** - Fastify + Prisma otimizado

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

---

## 📁 Estrutura do Projeto

```
OpenSea-API/
├── prisma/
│   ├── schema.prisma              # Schema do banco de dados
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
│   │   ├── core/                  # Entidades de autenticação
│   │   ├── sales/                 # Entidades de vendas
│   │   ├── stock/                 # Entidades de estoque
│   │   └── domain/                # Base classes (Entity, ValueObject)
│   │
│   ├── use-cases/                 # 🎯 APPLICATION LAYER
│   │   ├── core/                  # Casos de uso de autenticação
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
│   │   ├── controllers/           # Controllers organizados por módulo
│   │   ├── middlewares/           # Middlewares (auth, roles)
│   │   └── routes.ts              # Registro de rotas
│   │
│   ├── mappers/                   # Conversores (Entity ↔ DTO ↔ Prisma)
│   ├── services/                  # Serviços externos (email, etc)
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

### Core (Autenticação)

- ✅ Registro de usuários
- ✅ Login com senha
- ✅ JWT + Refresh Tokens
- ✅ Recuperação de senha
- ✅ Gestão de sessões
- ✅ Perfis de usuário
- ✅ Controle de acesso (ADMIN, MANAGER, USER)

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
