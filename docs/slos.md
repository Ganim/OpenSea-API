# Service Level Objectives (SLOs) — OpenSea Platform

**Última atualização:** 2026-03-09
**Janela de medição:** 30 dias rolling

---

## SLIs e SLOs

| SLI | Métrica | SLO | Medição | Alerta |
|-----|---------|-----|---------|--------|
| **Availability** | % requests com status < 500 | **99.9%** | 30-day rolling | < 99.5% → Critical |
| **Latency (API)** | P95 response time | **< 500ms** | Per endpoint | P95 > 1s → Warning |
| **Latency (DB)** | P95 query time | **< 100ms** | Per query | P95 > 500ms → Warning |
| **Error Rate** | % requests 5xx | **< 0.1%** | 30-day rolling | > 0.5% → Critical |
| **Queue Latency** | P95 job wait time | **< 30s** | Per queue | P95 > 60s → Warning |
| **Queue Success** | % jobs completed | **> 99%** | Per queue | < 95% → Critical |
| **Uptime** | Health check pass rate | **99.95%** | 1-min interval | 3 consecutive fails → Critical |

---

## Error Budget

Com SLO de 99.9% availability em 30 dias:
- **Budget total:** 43.2 minutos de downtime/mês
- **Budget semanal:** ~10.8 minutos
- Se o budget estiver esgotado: congelar deploys, focar em estabilidade

---

## Por Módulo

| Módulo | Endpoint Crítico | Latency Target | Justificativa |
|--------|-----------------|----------------|---------------|
| Auth | `POST /v1/auth/login` | < 300ms | Login deve ser rápido |
| Stock | `GET /v1/products` | < 400ms | Listagem principal |
| Finance | `POST /v1/finance/entries` | < 500ms | Criação com installments |
| Email | `POST /v1/email/sync` | < 5s | IMAP sync é naturalmente lento |
| Storage | `POST /v1/storage/files/upload` | < 10s | Upload depende do tamanho |
| Calendar | `GET /v1/calendar/events` | < 400ms | RRULE expansion inclusa |

---

## Ferramentas de Medição

- **Fly.io Metrics**: CPU, memory, request count, latency (built-in)
- **Sentry**: Error rate, P95 latency, error grouping
- **UptimeRobot**: External availability monitoring
- **Prometheus** (futuro): Custom business metrics

---

## Procedimento de Violação

1. **Warning** (SLO próximo do limite): Investigar causa raiz, priorizar fix
2. **Critical** (SLO violado): Freeze deploys, incident response, postmortem
3. **Budget esgotado**: Apenas hotfixes permitidos até budget renovar
