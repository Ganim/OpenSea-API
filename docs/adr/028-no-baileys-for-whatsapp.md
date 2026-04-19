# ADR 028 — WhatsApp: Apenas Cloud API (sem Baileys)

**Status:** Accepted
**Date:** 2026-04-17 (promovido da memória de 2026-03-25)

## Contexto

A integração do OpenSea com WhatsApp pode, tecnicamente, operar em dois modos via Evolution API:

1. **Cloud API** — API oficial da Meta (WhatsApp Business Platform). Paga por conversa, mas estável e contratualmente autorizada.
2. **Baileys** — biblioteca não-oficial que simula o WhatsApp Web. Gratuita, mas **sujeita a ban imediato** pela Meta sem aviso nem recurso.

## Decisão

Utilizaremos **exclusivamente o modo Cloud API** da Evolution API. O modo Baileys é proibido no OpenSea — não deve ser oferecido como opção, nem como "modo econômico", nem com disclaimer.

## Consequências

- Todo tenant que usa integração WhatsApp precisa configurar credenciais oficiais Meta (phoneNumberId, WABA ID, access token).
- Custo operacional é previsível e auditável (Meta cobra por conversa iniciada).
- Zero risco de perda de conta, histórico, ou continuidade de atendimento.
- A documentação de onboarding de WhatsApp deve ser explícita sobre o processo Meta Business (verificação de negócio, aprovação de número, etc.).

## Rationale

A reputação comercial e continuidade de atendimento dos tenants supera o custo da API oficial. Um ban via Baileys afetaria múltiplos tenants simultaneamente num cenário multi-tenant compartilhando infra de Evolution API, e seria impossível migrar clientes depois.
