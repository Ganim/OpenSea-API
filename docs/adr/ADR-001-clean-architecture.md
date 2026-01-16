# ADR-001: Adoção de Clean Architecture

## Status

Aceito

## Contexto

O OpenSea-API é um sistema de gestão empresarial que precisa:

1. Ser mantido por múltiplos desenvolvedores ao longo do tempo
2. Ter alta cobertura de testes para garantir qualidade
3. Permitir evolução independente de camadas (ex: trocar ORM)
4. Escalar horizontalmente quando necessário
5. Separar claramente regras de negócio de detalhes de infraestrutura

## Decisão

Adotamos **Clean Architecture** como padrão arquitetural do projeto, com as seguintes camadas:

### Camadas

1. **Domain Layer** (Entities)
   - Entidades de negócio
   - Value Objects
   - Erros de domínio
   - Zero dependências externas

2. **Application Layer** (Use Cases)
   - Casos de uso da aplicação
   - Orquestração de regras de negócio
   - Interfaces de repositórios
   - Serviços de aplicação

3. **Infrastructure Layer** (Adapters)
   - Implementações de repositórios (Prisma)
   - Integrações externas (Redis, Sentry)
   - Workers e filas

4. **Interface Layer** (HTTP)
   - Controllers HTTP (Fastify)
   - Middlewares
   - Validação de entrada (Zod)
   - Serialização de saída

### Regra de Dependência

```
Interface → Application → Domain ← Infrastructure
```

Dependências apontam apenas para dentro (Domain não conhece Infrastructure).

## Consequências

### Positivas

- **Testabilidade**: Use cases testáveis com repositórios in-memory
- **Manutenibilidade**: Mudanças isoladas em cada camada
- **Flexibilidade**: Fácil trocar implementações (ex: Prisma → TypeORM)
- **Clareza**: Separação clara de responsabilidades
- **Escalabilidade**: Camadas podem ser escaladas independentemente

### Negativas

- **Complexidade inicial**: Mais arquivos e boilerplate
- **Curva de aprendizado**: Desenvolvedores precisam entender os padrões
- **Overhead**: Mapeamentos entre camadas (Domain ↔ Prisma ↔ DTO)
- **Tempo de desenvolvimento**: Inicial mais lento para features simples

## Alternativas Consideradas

1. **MVC Tradicional**: Mais simples, mas mistura responsabilidades
2. **Hexagonal Architecture**: Similar, mas com terminologia diferente
3. **CQRS**: Mais complexo do que necessário para o momento

## Referências

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [The Clean Code Blog](https://blog.cleancoder.com/)
