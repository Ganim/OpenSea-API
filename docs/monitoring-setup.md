# Monitoring Setup Guide — OpenSea Platform

**Última atualização:** 2026-03-09

---

## 1. UptimeRobot (3.2 — Uptime Monitoring Externo)

### Configuração

1. Criar conta em [uptimerobot.com](https://uptimerobot.com) (free tier: 50 monitors)
2. Adicionar monitors:

| Monitor | URL | Interval | Type |
|---------|-----|----------|------|
| API Health | `https://opensea-api.fly.dev/health/live` | 1 min | HTTP |
| APP Frontend | `https://opensea-app.fly.dev/` | 1 min | HTTP |

3. Configurar alertas:
   - **Email**: admin@opensea.com
   - **Slack** (opcional): Webhook para canal #alerts

### Status Page (opcional)

UptimeRobot oferece status page gratuita:
- URL: `https://stats.uptimerobot.com/opensea`
- Incluir ambos monitors

---

## 2. Sentry Alerting Rules (3.1)

### Regras a Configurar no Dashboard Sentry

Acessar: `Settings > Alerts > Create Alert Rule`

#### Rule 1: High Error Rate
- **When:** Number of events > 5 in 1 minute
- **Filter:** `event.type:error`
- **Action:** Send Slack notification to #alerts
- **Priority:** Critical

#### Rule 2: High Latency
- **When:** P95 transaction duration > 2000ms for 5 minutes
- **Filter:** `transaction.duration:>2000`
- **Action:** Send Slack notification to #alerts
- **Priority:** Warning

#### Rule 3: Unhandled Exception
- **When:** A new issue is created
- **Filter:** `!handled:true`
- **Action:** Send Slack notification to #alerts + assign to on-call
- **Priority:** Critical

#### Rule 4: New Error Pattern
- **When:** First seen event
- **Filter:** None (all new issues)
- **Action:** Send Slack notification to #dev
- **Priority:** Info

### Performance Monitoring

Verificar em Sentry:
- `Performance > Transactions` — P50/P75/P95/P99 por endpoint
- `Performance > Database` — Slow queries
- `Performance > Web Vitals` — Frontend metrics (se Sentry configurado no APP)

---

## 3. Fly.io Built-in Metrics

Fly.io já coleta métricas automaticamente:

```bash
# Ver métricas no terminal
fly metrics --app opensea-api

# Dashboard
fly dashboard --app opensea-api
```

Métricas disponíveis:
- `fly_instance_up` — Instance health
- `fly_edge_http_responses_count` — Request count by status
- `fly_app_http_response_time` — Response time histogram
- `fly_instance_memory_*` — Memory usage
- `fly_instance_cpu_*` — CPU usage
