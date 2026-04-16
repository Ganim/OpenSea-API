# HR Cron Jobs — Production Deployment Guide

Este guia descreve os três jobs agendados do módulo de RH, como executá-los
localmente, e como configurá-los em produção (Fly.io, Kubernetes, GitHub
Actions ou systemd).

## Visão geral

Existem **dois caminhos** para executar os jobs em produção. Escolha **um** —
nunca os dois ao mesmo tempo, sob risco de execução duplicada:

1. **In-process schedulers** (`src/workers/`) — laços `setInterval` que rodam
   dentro do processo de workers (`Dockerfile.worker`,
   `npm run workers:start`). Já estão registrados em `src/workers/index.ts` e
   utilizam uma chave de idempotência por mês/dia para evitar reexecução.
2. **Standalone cron scripts** (`scripts/`) — entradas únicas, sem estado, que
   processam todos os tenants ativos e encerram o processo. Adequados para
   `fly machine run --schedule`, Kubernetes `CronJob`, GitHub Actions
   `schedule:` ou `systemd` timers. Esta é a abordagem **recomendada** em
   produção pois:
   - Não consome memória em idle
   - Idempotente por construção (encerra após o processamento)
   - Logs ficam separados por execução, facilitando o troubleshooting
   - Pode ser disparado manualmente sem interferir nos workers de fila

## Os três jobs

| Job                          | Cron expression  | Frequência                                      | Use case                                    | Idempotência                                                                |
| ---------------------------- | ---------------- | ----------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| Vacation accrual             | `0 2 1 * *`      | Mensal — todo dia 1 às 02:00 UTC                | `RunVacationAccrualUseCase`                 | Período PENDING existente para o ciclo aquisitivo é detectado e ignorado    |
| Document expiry notification | `0 8 * * *`      | Diário — 08:00 UTC                              | `NotifyDocExpiryUseCase`                    | Notificações dedup. em `(userId + entityType + entityId)`                   |
| Monthly payroll draft        | `0 3 25 * *`     | Mensal — todo dia 25 às 03:00 UTC               | `GenerateMonthlyPayrollDraftUseCase`        | `findByPeriod(month, year, tenantId)` retorna folha existente sem recriar   |

### 1. Vacation accrual

- **Script**: `scripts/hr-vacation-accrual-cron.ts`
- **NPM**: `npm run cron:hr-vacation-accrual`
- **Comportamento**: Para cada tenant ativo, abre um novo período aquisitivo
  de férias para todo funcionário ativo que tenha completado um novo
  aniversário de 12 meses desde a admissão e que ainda não possua um período
  PENDING aberto cobrindo a data de referência.

### 2. Document expiry notification

- **Script**: `scripts/hr-doc-expiry-cron.ts`
- **NPM**: `npm run cron:hr-doc-expiry`
- **Comportamento**: Para cada tenant ativo, varre exames médicos
  (ASO/PCMSO) e matrículas em treinamentos cujo vencimento ocorrerá nos
  próximos 30 dias (default `lookaheadDays`) e dispara uma notificação in-app
  para o supervisor (ou para o próprio funcionário caso não haja supervisor
  associado).

### 3. Monthly payroll draft

- **Script**: `scripts/hr-payroll-generation-cron.ts`
- **NPM**: `npm run cron:hr-payroll-generation`
- **Comportamento**: Para cada tenant ativo, cria uma folha de pagamento
  rascunho (vazia) para o mês/ano corrente caso ainda não exista. O cálculo
  efetivo das verbas é responsabilidade exclusiva do `CalculatePayrollUseCase`,
  acionado manualmente pelo gestor de RH após revisão.

## Execução local

Pré-requisitos: `.env` com `DATABASE_URL` válido apontando para o banco
local (Docker Compose) e tenants ativos.

```bash
# Vacation accrual
npm run cron:hr-vacation-accrual

# Document expiry
npm run cron:hr-doc-expiry

# Payroll draft
npm run cron:hr-payroll-generation
```

Saída esperada (exemplo, payroll draft):

```
[hr-payroll-generation-cron] Starting at 2026-04-25T03:00:00.000Z
[hr-payroll-generation-cron] Found 3 active tenants
[hr-payroll-generation-cron] Tenant "Empresa Demo": draft created for 04/2026 (payrollId=..., evaluated=12)
[hr-payroll-generation-cron] Summary:
  Tenants processed:    3
  Failed tenants:       0
  Drafts created:       1
  Already existed:      2
  Tenants without employees: 0
  Duration: 412ms
[hr-payroll-generation-cron] Done at 2026-04-25T03:00:00.412Z
```

Exit codes: `0` em sucesso (mesmo sem tenants), `1` se ao menos um tenant
falhar (o erro é logado mas a iteração segue para os demais).

## Produção — Fly.io (recomendado)

Cada job vira uma máquina efêmera agendada, reaproveitando a imagem do app:

```bash
# Mensal — todo dia 1 às 02:00 UTC
fly machine run . \
  --schedule monthly \
  --command "npm run cron:hr-vacation-accrual" \
  --region gru \
  -a opensea-api

# Diário — 08:00 UTC
fly machine run . \
  --schedule daily \
  --command "npm run cron:hr-doc-expiry" \
  --region gru \
  -a opensea-api

# Mensal — todo dia 25 às 03:00 UTC
fly machine run . \
  --schedule monthly \
  --command "npm run cron:hr-payroll-generation" \
  --region gru \
  -a opensea-api
```

**Atenção**: o `--schedule monthly` do Fly dispara no dia 1 do mês. Para o
`payroll-generation` que precisa rodar **dia 25**, crie uma cron própria via
GitHub Actions (ver abaixo) ou utilize uma máquina sempre ativa
(`Dockerfile.worker` + `npm run workers:start`) cujo scheduler interno já
respeita a data alvo.

Para inspecionar:

```bash
fly machine list -a opensea-api
fly logs -a opensea-api -i <machine-id>
```

## Produção — Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: opensea-hr-vacation-accrual
spec:
  schedule: "0 2 1 * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  jobTemplate:
    spec:
      backoffLimit: 0
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: cron
              image: ghcr.io/opensea/opensea-api:latest
              command: ["npm", "run", "cron:hr-vacation-accrual"]
              envFrom:
                - secretRef:
                    name: opensea-api-secrets
```

Replique o manifesto trocando `name`, `schedule` e o nome do script para
`cron:hr-doc-expiry` (`0 8 * * *`) e `cron:hr-payroll-generation`
(`0 3 25 * *`).

## Produção — GitHub Actions (`schedule:`)

```yaml
# .github/workflows/hr-cron.yml
name: HR cron jobs
on:
  schedule:
    - cron: "0 2 1 * *"   # vacation accrual
    - cron: "0 8 * * *"   # doc expiry
    - cron: "0 3 25 * *"  # payroll draft
  workflow_dispatch:

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx prisma generate
      - name: Dispatch
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          case "${{ github.event.schedule }}" in
            "0 2 1 * *")  npm run cron:hr-vacation-accrual ;;
            "0 8 * * *")  npm run cron:hr-doc-expiry ;;
            "0 3 25 * *") npm run cron:hr-payroll-generation ;;
            *)            echo "manual run" && npm run cron:hr-doc-expiry ;;
          esac
```

## Produção — systemd timer

Exemplo para `hr-doc-expiry` em uma VM Linux com o repositório clonado em
`/opt/opensea-api`:

```ini
# /etc/systemd/system/opensea-hr-doc-expiry.service
[Unit]
Description=OpenSea HR doc expiry cron
After=network-online.target

[Service]
Type=oneshot
User=opensea
WorkingDirectory=/opt/opensea-api
EnvironmentFile=/opt/opensea-api/.env
ExecStart=/usr/bin/npm run cron:hr-doc-expiry
```

```ini
# /etc/systemd/system/opensea-hr-doc-expiry.timer
[Unit]
Description=Daily HR doc expiry trigger

[Timer]
OnCalendar=*-*-* 08:00:00 UTC
Persistent=true
Unit=opensea-hr-doc-expiry.service

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now opensea-hr-doc-expiry.timer
sudo systemctl list-timers | grep opensea
```

Replique para os outros dois jobs ajustando `OnCalendar`.

## Health check / observabilidade

Os scripts emitem um sumário estruturado no `stdout` ao final de cada
execução. Em produção, encaminhe esses logs para sua stack de observabilidade
(Sentry breadcrumbs, Loki, CloudWatch). Métricas relevantes a monitorar:

- **Vacation accrual**: `Created periods > 0` é esperado todo dia 1 do mês —
  alertar se duas execuções consecutivas reportarem zero.
- **Doc expiry**: `Notifications` deve refletir o backlog do mês corrente —
  ausência absoluta de notificações por mais de 7 dias é suspeita.
- **Payroll draft**: `Drafts created` deve ser exatamente 1 por tenant ativo
  por mês — qualquer divergência indica reprocessamento ou tenant sem
  funcionários.

Em qualquer caso, `Failed tenants > 0` deve ser imediatamente alarmado.

## Não use os dois caminhos simultaneamente

Se a infra externa (Fly Machines / K8s CronJob / GHA) já está executando os
scripts, **remova os schedulers do `src/workers/index.ts`** ou sobreponha o
processo de workers com um worker dedicado a filas BullMQ apenas. Caso
contrário, a mesma janela de tempo pode disparar duas execuções em paralelo
e, embora os use cases sejam idempotentes, o duplo trabalho gera ruído e
custo desnecessário no banco.
