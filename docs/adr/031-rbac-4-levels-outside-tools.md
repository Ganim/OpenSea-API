# ADR 031 — RBAC 4 níveis fora do módulo `tools` + LIA Device Fingerprint

**Status:** Accepted
**Date:** 2026-04-25
**Phase:** 9 — Antifraude Hardening
**Decision authority:** User (D-28 do `09-CONTEXT.md`)
**Supersedes:** none
**Related:** ADR-024 (RBAC 4-level permission codes), Phase 6 `hr.compliance.*` cluster, Phase 9 `hr.punch.audit.*` cluster

> NOTA — numeração: o plano original de Phase 9 reservou o slot ADR-027, mas
> esse número já estava ocupado (`027-domain-event-bus-extension.md`). Mantida
> a continuidade da numeração sequencial: este ADR ocupa o número 031.
> Referências internas no código (comentários em `permission-codes.ts:354-369`
> e em `backfill-phase9-permissions.ts`) usam apenas o slug "ADR-027/031" para
> não quebrar a busca textual; o filename canônico é
> `031-rbac-4-levels-outside-tools.md`.

## Context

A documentação histórica do projeto (CLAUDE.md raiz, `docs/patterns/backend-patterns-overview.md`) afirmava que apenas o módulo `tools` usa permissões em 4 níveis (`{module}.{group}.{resource}.{action}`). Em todas as outras áreas, o padrão era 3 níveis (`{module}.{resource}.{action}`).

Durante Phase 6 (Compliance Portaria 671), o cluster `hr.compliance.*` foi introduzido com 4 níveis (`hr.compliance.afd.generate`, `hr.compliance.afdt.generate`, etc. — `permission-codes.ts:368-377`). O parser `parsePermissionCode` (linhas ~1448-1466) já trata ambos os shapes corretamente — o sub-recurso é absorvido em `resource` (ADR-024).

Em Phase 9 (Antifraude Hardening), o cluster `hr.punch.audit.*` foi adicionado pelo mesmo motivo: granularidade fine-grained sobre um sub-recurso (`punch.audit`) que pode ganhar futuras actions (`access`, `export`, `admin`) sem renomear ou criar um cluster paralelo.

CONTEXT.md D-28 sinalizou que esta NÃO é a primeira ocorrência ("primeiro módulo não-tools" foi atualizado em PATTERNS.md Note 1) e expressou intenção de propagar 4 níveis para outras áreas onde a granularidade hierárquica trouxer clareza.

Adicionalmente, Phase 9 introduz **device fingerprint** (canvas hash + UA + screen + tz + lang) em toda batida (REQ PUNCH-FRAUD-03, D-13/D-14/D-15). LGPD ANPD considera fingerprint dado pessoal indireto. A base legal escolhida é **interesse legítimo** (Art. 7º X, LGPD), justificada por prevenção a fraude trabalhista.

## Decision

1. RBAC 4 níveis é **PERMITIDO** fora do módulo `tools` quando houver:
   - Sub-recurso identificável (ex: `punch.audit`, `compliance.afd`, `compliance.s1200`)
   - Múltiplas actions previstas no mesmo sub-recurso (ex: `access`, `export`, `admin`)
   - Necessidade de granularidade que 3 níveis tornaria ambíguo

2. RBAC 3 níveis **PERMANECE** o default para casos sem sub-recurso (`hr.punch-approvals.access`, `hr.punch-devices.modify`).

3. `parsePermissionCode` continua sendo a fonte canônica de parsing — nunca ler código manualmente. Sub-recurso é absorvido em `resource` (ADR-024 §2 / Option B).

4. O `extractAllCodes(PermissionCodes)` deve recursivamente coletar codes em qualquer profundidade (já implementado desde Phase 6 — verificado em `permission-codes.spec.ts`).

5. Backfill scripts (`backfill-phaseN-permissions.ts`) são **aditivos** (`createMany skipDuplicates`), nunca destrutivos (`deleteMany`). Lesson 04-06 incorporada.

6. **Device Fingerprint LIA (Legitimate Interest Assessment) — LGPD Art. 7º X:**
   - **Finalidade:** prevenção de fraude trabalhista (compartilhamento de crachás, batidas duplicadas em devices distintos sem justificativa, mock GPS).
   - **Necessidade:** captura é PROPORCIONAL ao risco — apenas 5 campos low-entropy (`canvasHash`, `userAgent`, `screen`, `timezone`, `language`). NÃO usamos GPU fingerprint, audio fingerprint, nem WebRTC IP enumeration. Hash final é `sha256(JSON.stringify(fields))`.
   - **Balancing test:** funcionário tem expectativa razoável de monitoramento de fraude no canal de ponto (CLT Art. 6º + jurisprudência consolidada). Fingerprint NÃO é compartilhado fora do tenant. NÃO é usado para targeting publicitário, segmentação, ou cross-site tracking.
   - **Audit-only nesta fase:** D-16 — fingerprint divergente NÃO bloqueia batida. Apenas alimenta `/hr/punch/audit` para revisão humana.
   - **Opt-out:** preferences do usuário não desabilitam captura (legítimo interesse), mas o funcionário pode contestar via Encarregado de Dados (DPO) usando o canal de exercício de direitos LGPD do tenant.
   - **Retenção:** fingerprint persiste em `TimeEntry.deviceFingerprint` (VARCHAR) + `TimeEntry.metadata.fingerprintRaw` (JSONB) seguindo a mesma política da batida em si — Portaria 671 exige retenção de 5 anos para AFD; fingerprint herda o mesmo prazo.

## Consequences

**Positive:**

- Granularidade hierárquica para sub-recursos (ex: `hr.punch.audit.export` futuro sem renomear).
- LGPD-aligned: device fingerprint com base legal documentada e LIA explícita.
- Padrão consistente entre `hr.compliance.*` (Phase 6) e `hr.punch.audit.*` (Phase 9).
- `parsePermissionCode` já era preparado para ambos os shapes — zero refactor downstream.

**Negative:**

- Documentação em `CLAUDE.md` raiz precisa ser atualizada (a afirmação "tools é o único 4-níveis" está desatualizada desde Phase 6 e oficialmente revisada agora).
- ADR review por DPO recomendado antes de produção GA (assumption A5 RESEARCH).
- A dívida técnica de sync TS↔Prisma do `AuditAction` enum (PUNCH_AUDIT_MARK_SUSPICION, PUNCH_AUDIT_VIEW) continua aberta — Plan 09-03/09-04 deve fechá-la quando implementar o controller `/hr/punch/audit`.

**Neutral:**

- Backfill scripts já seguem o pattern (Plan 04-06, 06-01, 07-01) — nada novo a aprender pelos próximos planos.
- A coexistência de 3 e 4 níveis no mesmo módulo (`hr.punch-approvals.*` + `hr.punch.audit.*`) é resolvida pelo parser sem conflito; admins de tenant não percebem diferença operacional.

## Compliance / Privacy Reviewer Sign-off

- [ ] DPO review da LIA Device Fingerprint (pendente — antes de prod GA)
- [ ] Legal review do MaxMind GeoLite2 EULA (pendente — RESEARCH §A6) quando o adapter geoip for plugado em Plan 09-02

## References

- ADR-024: `024-rbac-4-level-permission-codes.md` — parser comportamento e Option B
- Phase 6 / Plan 06-01: introdução de `hr.compliance.*` cluster
- Phase 9 / Plan 09-01: este plano — introdução de `hr.punch.audit.*` cluster
- Decision: `09-CONTEXT.md` §D-28 — propagação intencional sinalizada pelo usuário
- Code:
  - `OpenSea-API/src/constants/rbac/permission-codes.ts` (cluster + comentário inline)
  - `OpenSea-API/prisma/backfill-phase9-permissions.ts` (idempotent registration)
  - `OpenSea-API/prisma/migrations/20260425230000_phase9_antifraude_enums_perm/migration.sql` (DB row INSERT ON CONFLICT)
