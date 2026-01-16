# Checklist de Implementação - OpenSea-API

## Status Geral

| Fase | Progresso | Status |
|------|-----------|--------|
| Fase 1 - Curto Prazo | 0/6 | Pendente |
| Fase 2 - Médio Prazo | 0/6 | Pendente |
| Fase 3 - Longo Prazo | 0/7 | Pendente |

---

## Fase 1: Curto Prazo (2-4 semanas)

### 1.1 Redis Cache
- [ ] Instalar dependências (`ioredis`, `@fastify/redis`)
- [ ] Criar `src/lib/redis.ts`
- [ ] Criar `src/config/redis.ts`
- [ ] Adicionar variáveis REDIS_* em `src/@env/index.ts`
- [ ] Criar `src/services/cache/cache-service.ts`
- [ ] Migrar cache de permissões para Redis
- [ ] Adicionar Redis ao `docker-compose.yml`
- [ ] Testar cache hit/miss
- [ ] Testar invalidação de cache

### 1.2 Health Check
- [ ] Criar `src/http/controllers/core/health/routes.ts`
- [ ] Criar `v1-health-check.controller.ts`
- [ ] Criar `v1-readiness-check.controller.ts`
- [ ] Criar `v1-liveness-check.controller.ts`
- [ ] Testar endpoint `/health`
- [ ] Testar endpoint `/health/ready`
- [ ] Testar endpoint `/health/live`

### 1.3 Circuit Breaker
- [ ] Instalar `opossum`
- [ ] Criar `src/lib/circuit-breaker.ts`
- [ ] Criar `src/config/circuit-breaker.ts`
- [ ] Aplicar em repositories de alto uso
- [ ] Testar abertura do circuit
- [ ] Testar recuperação (half-open → closed)
- [ ] Adicionar logs de estado

### 1.4 Helmet
- [ ] Instalar `@fastify/helmet`
- [ ] Configurar em `src/app.ts`
- [ ] Testar headers com securityheaders.com
- [ ] Ajustar CSP para Swagger UI

### 1.5 Validação CPF/CNPJ
- [ ] Instalar `cpf-cnpj-validator`
- [ ] Criar/modificar Value Object CPF
- [ ] Criar/modificar Value Object CNPJ
- [ ] Atualizar schemas Zod
- [ ] Adicionar testes unitários
- [ ] Testar com CPFs/CNPJs inválidos

### 1.6 CI/CD Melhorias
- [ ] Criar `.github/workflows/lint.yml`
- [ ] Atualizar `run-unit-tests.yml` com coverage
- [ ] Corrigir database name em `run-e2e-tests.yml`
- [ ] Configurar Codecov
- [ ] Definir coverage mínimo (70%)
- [ ] Testar pipeline completa

---

## Fase 2: Médio Prazo (1-2 meses)

### 2.1 JWT RS256
- [ ] Criar script de geração de chaves
- [ ] Gerar keypair RSA
- [ ] Criar `src/config/jwt.ts`
- [ ] Adicionar variáveis JWT_PRIVATE_KEY, JWT_PUBLIC_KEY
- [ ] Configurar Fastify JWT com RS256
- [ ] Implementar migração gradual (dual support)
- [ ] Testar tokens novos
- [ ] Testar tokens legados (HS256)
- [ ] Documentar processo de rotação de chaves

### 2.2 BullMQ
- [ ] Instalar `bullmq`
- [ ] Criar `src/lib/queue.ts`
- [ ] Criar fila de notificações
- [ ] Criar fila de emails
- [ ] Criar fila de audit logs
- [ ] Criar processors para cada fila
- [ ] Migrar worker de notificações
- [ ] Configurar retry e backoff
- [ ] Instalar Bull Board (opcional)
- [ ] Testar processamento assíncrono
- [ ] Testar retry em falhas

### 2.3 Cursor Pagination
- [ ] Criar `src/http/schemas/pagination.schema.ts`
- [ ] Criar helper `paginateWithCursor`
- [ ] Implementar em `/v1/products`
- [ ] Implementar em `/v1/audit/logs`
- [ ] Documentar no Swagger
- [ ] Manter compatibilidade com offset/limit
- [ ] Testar navegação forward/backward

### 2.4 Sentry
- [ ] Criar conta Sentry e projeto
- [ ] Instalar `@sentry/node`
- [ ] Criar `src/lib/sentry.ts`
- [ ] Adicionar SENTRY_DSN ao env
- [ ] Integrar no error handler
- [ ] Configurar sampling rate
- [ ] Configurar ignoreErrors
- [ ] Testar captura de erro
- [ ] Configurar alertas

### 2.5 RBAC Resource Scope
- [ ] Adicionar campos resourceType/resourceId no schema
- [ ] Criar migration
- [ ] Atualizar PermissionService
- [ ] Atualizar middleware verify-permission
- [ ] Criar helper getResourceScope
- [ ] Testar permissão global
- [ ] Testar permissão com escopo
- [ ] Documentar novo modelo

### 2.6 Request ID
- [ ] Instalar `@fastify/request-context`
- [ ] Criar `src/http/plugins/request-id.plugin.ts`
- [ ] Registrar plugin em app.ts
- [ ] Atualizar logger com requestId
- [ ] Testar propagação de X-Request-ID
- [ ] Verificar logs correlacionados

---

## Fase 3: Longo Prazo (2-3 meses)

### 3.1 Documentação
- [ ] Criar README.md completo
- [ ] Criar CONTRIBUTING.md
- [ ] Criar docs/ARCHITECTURE.md
- [ ] Criar pasta docs/adr/
- [ ] ADR-001: Clean Architecture
- [ ] ADR-002: Escolha de Fastify
- [ ] ADR-003: RBAC vs ABAC
- [ ] Criar docs/deployment/
- [ ] Criar docs/runbooks/
- [ ] Revisar documentação Swagger

### 3.2 Testes de Carga
- [ ] Instalar k6
- [ ] Criar cenário de smoke test
- [ ] Criar cenário de stress test
- [ ] Criar cenário de spike test
- [ ] Criar cenário de auth flow
- [ ] Criar cenário de listagem
- [ ] Definir thresholds
- [ ] Executar baseline
- [ ] Documentar resultados
- [ ] Adicionar ao CI (opcional)

### 3.3 Testes de Segurança
- [ ] Configurar Snyk
- [ ] Criar workflow security.yml
- [ ] Configurar CodeQL
- [ ] Executar npm audit
- [ ] Configurar OWASP ZAP
- [ ] Criar regras de exclusão
- [ ] Executar scan baseline
- [ ] Corrigir vulnerabilidades encontradas
- [ ] Documentar exceções aceitas

### 3.4 Rate Limit por Usuário
- [ ] Criar `src/http/plugins/rate-limit.plugin.ts`
- [ ] Implementar limites por tier
- [ ] Integrar com Redis
- [ ] Adicionar headers X-RateLimit-*
- [ ] Testar limite anonymous
- [ ] Testar limite authenticated
- [ ] Documentar limites

### 3.5 Audit com HMAC
- [ ] Adicionar campo signature ao schema
- [ ] Criar migration
- [ ] Criar AuditService com HMAC
- [ ] Adicionar AUDIT_HMAC_SECRET ao env
- [ ] Criar endpoint verify-integrity
- [ ] Criar endpoint verify-chain
- [ ] Testar assinatura
- [ ] Testar verificação

### 3.6 Database Optimization
- [ ] Habilitar pg_stat_statements
- [ ] Identificar queries lentas
- [ ] Analisar índices não utilizados
- [ ] Criar índices em timestamps
- [ ] Criar índices compostos
- [ ] Testar com EXPLAIN ANALYZE
- [ ] Configurar vacuum/analyze
- [ ] Documentar otimizações

### 3.7 Containerização
- [ ] Criar Dockerfile multi-stage
- [ ] Criar Dockerfile.worker
- [ ] Criar .dockerignore
- [ ] Atualizar docker-compose.yml
- [ ] Criar docker-compose.prod.yml
- [ ] Configurar healthchecks
- [ ] Testar build local
- [ ] Testar docker-compose up
- [ ] Documentar processo de deploy

---

## Notas de Implementação

### Decisões Tomadas
| Data | Item | Decisão | Razão |
|------|------|---------|-------|
| | | | |

### Problemas Encontrados
| Data | Item | Problema | Solução |
|------|------|----------|---------|
| | | | |

### Métricas Coletadas
| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Latência p95 | - | - | - |
| Coverage | - | - | - |
| Vulnerabilidades | - | - | - |

---

*Última atualização: [DATA]*
