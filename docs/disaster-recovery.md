# Disaster Recovery Plan — OpenSea Platform

**Última atualização:** 2026-03-09
**Responsável:** Equipe de Engenharia

---

## Cenários e Procedimentos

### 1. API Instance Down

| Aspecto | Detalhe |
|---------|---------|
| **Detecção** | Fly.io health check (`/health/live`, intervalo 15s) |
| **Recuperação** | Automática — Fly.io reinicia instância |
| **HA** | `min_machines_running = 2`, load balancer distribui tráfego |
| **RTO** | < 30s (auto-restart) |
| **RPO** | 0 (stateless, sem perda de dados) |

**Procedimento manual (se auto-restart falhar):**
```bash
fly status --app opensea-api
fly machines restart --app opensea-api
# Se necessário, rollback:
fly releases rollback --app opensea-api
```

---

### 2. Database Unreachable (Neon PostgreSQL)

| Aspecto | Detalhe |
|---------|---------|
| **Detecção** | Health endpoint retorna `degraded`; Sentry alert |
| **Recuperação** | Neon auto-failover (replicação síncrona) |
| **Backup** | Point-in-time recovery (últimos 7 dias, plano Pro: 30 dias) |
| **RTO** | < 5min (Neon auto-failover) |
| **RPO** | 0 (replicação síncrona) |

**Procedimento:**
1. Verificar status no [Neon Console](https://console.neon.tech)
2. Se problema persistir > 5min, criar branch de recovery:
   ```
   Neon Console > Branches > Create Branch (from last healthy point)
   ```
3. Atualizar `DATABASE_URL` no Fly.io:
   ```bash
   fly secrets set DATABASE_URL="nova-connection-string" --app opensea-api
   ```
4. Redeploy: `fly deploy --app opensea-api`

---

### 3. Redis Down

| Aspecto | Detalhe |
|---------|---------|
| **Detecção** | Health endpoint campo `redis: down`; logs de reconexão |
| **Degradação graceful** | Rate limiter permite tudo, cache misses vão ao DB |
| **Queues** | BullMQ auto-reconnect com backoff exponencial |
| **RTO** | < 2min (Fly Redis auto-restart) |

**Impacto por feature:**
- Rate limiting: desabilitado (fail-open)
- Login brute-force guard: desabilitado (fail-open)
- Session cache: fallback para DB
- Email queues: pausam e retomam automaticamente
- Notification queues: pausam e retomam automaticamente

**Procedimento:**
```bash
fly redis status --app opensea-api
fly redis restart --app opensea-api
```

---

### 4. Storage (S3) Unreachable

| Aspecto | Detalhe |
|---------|---------|
| **Detecção** | Upload/download falham; Sentry alerts |
| **Impacto** | File Manager inoperante, label preview indisponível |
| **Mitigação** | Metadata preservado no DB, arquivos recuperáveis quando S3 voltar |
| **RTO** | Depende do provedor S3 |

**Procedimento:**
1. Verificar status do provedor S3
2. Se migração necessária, atualizar env vars:
   ```bash
   fly secrets set S3_ENDPOINT="..." S3_BUCKET="..." --app opensea-api
   ```

---

### 5. Full Region Outage (GRU)

| Aspecto | Detalhe |
|---------|---------|
| **Detecção** | UptimeRobot alerta, todos os health checks falham |
| **Failover** | Manual — deploy para região secundária |
| **RTO** | < 30min |
| **RPO** | Último Neon branch point |

**Procedimento:**
```bash
# 1. Criar app em região alternativa
fly apps create opensea-api-dr --region iad

# 2. Criar Neon branch na região mais próxima
# (via Neon Console)

# 3. Deploy com config alternativa
fly deploy --app opensea-api-dr --region iad

# 4. Atualizar DNS/frontend para apontar para nova região
fly secrets set API_URL="https://opensea-api-dr.fly.dev" --app opensea-app
```

---

### 6. Comprometimento de Credenciais

| Aspecto | Detalhe |
|---------|---------|
| **Detecção** | Atividade anômala, alertas Sentry, audit logs |
| **Impacto** | Depende do escopo (DB, JWT secret, S3, SMTP) |

**Procedimento imediato:**
1. **JWT_SECRET comprometido:**
   ```bash
   # Gera novo secret e invalida TODOS os tokens ativos
   fly secrets set JWT_SECRET="$(openssl rand -hex 64)" --app opensea-api
   ```
2. **DATABASE_URL comprometido:**
   - Rotacionar senha no Neon Console
   - Atualizar secret no Fly.io
3. **Email credentials:**
   - Rotacionar senhas SMTP/IMAP nos provedores
   - Re-encriptar no sistema (todas as contas afetadas)

---

## Checklist de Verificação Pós-Incidente

- [ ] Causa raiz identificada
- [ ] Fix aplicado e deployado
- [ ] Monitoramento confirmado como operacional
- [ ] Dados verificados como consistentes
- [ ] Postmortem escrito (se downtime > 5min)
- [ ] SLO impact calculado (error budget consumido)
- [ ] Ações preventivas planejadas

---

## Contatos

| Papel | Responsabilidade |
|-------|-----------------|
| **On-call Engineer** | Primeiro responder, triage |
| **Tech Lead** | Decisão de rollback, comunicação |
| **DBA** | Recuperação de banco, backups |
