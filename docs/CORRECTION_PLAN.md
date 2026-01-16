# 🔧 Plano de Correção - OpenSea API

Este documento detalha os problemas encontrados na avaliação do sistema e o plano de correção.

---

## 📊 Resumo dos Problemas

| Categoria | Quantidade | Prioridade |
|-----------|------------|------------|
| Erros TypeScript | 34 | Alta |
| Testes Unitários Falhando | 39 | Média |
| Módulos Incompletos | 1 (Volumes) | Alta |

---

## 🔴 Prioridade Alta

### 1. Criar `@/repositories/pagination-params`

**Problema:** Módulo não encontrado em múltiplos arquivos do módulo de volumes.

**Arquivos afetados:**
- `src/repositories/stock/in-memory/in-memory-volumes-repository.ts`
- `src/repositories/stock/prisma/prisma-volumes-repository.ts`
- `src/repositories/stock/volumes-repository.ts`

**Solução:**
```typescript
// src/repositories/pagination-params.ts
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

---

### 2. Completar `InMemoryVolumesRepository`

**Problema:** Métodos faltantes no repositório in-memory usado nos testes.

**Métodos faltantes:**
- `findByCode(code: string)`
- `findById(id: string)`
- `list(params: PaginationParams)`

**Arquivo:** `src/repositories/stock/in-memory/in-memory-volumes-repository.ts`

**Solução:** Implementar os métodos seguindo o padrão dos outros repositórios in-memory.

---

### 3. Corrigir enums de Audit

**Problema:** Incompatibilidade entre enums do domínio e enums do Prisma.

**Arquivos afetados:**
- `src/repositories/audit/prisma/prisma-audit-logs-repository.ts` (linhas 111, 115, 142, 143, 164, 548)

**Solução:** Usar type casting ou criar um mapper para converter entre os tipos:

```typescript
// Opção 1: Type assertion
action: request.action as $Enums.AuditAction,

// Opção 2: Mapper
import { AuditAction as DomainAuditAction } from '@/entities/audit/audit-action.enum'
import { AuditAction as PrismaAuditAction } from '@prisma/client'

function toPrismaAuditAction(action: DomainAuditAction): PrismaAuditAction {
  return action as unknown as PrismaAuditAction
}
```

---

### 4. Corrigir `PrismaVolumesRepository`

**Problema:** Import incorreto de `PrismaService`.

**Arquivo:** `src/repositories/stock/prisma/prisma-volumes-repository.ts` (linha 1)

**Solução:**
```typescript
// De:
import { PrismaService } from '@/lib/prisma'

// Para:
import { prisma } from '@/lib/prisma'
```

---

### 5. Corrigir tipos implícitos `any`

**Problema:** Parâmetros sem tipo explícito.

**Arquivos afetados:**
- `src/repositories/stock/prisma/prisma-volumes-repository.ts` (linhas 87, 113)

**Solução:** Adicionar tipos explícitos aos parâmetros dos callbacks.

---

## 🟡 Prioridade Média

### 6. Atualizar testes de `RefreshSession`

**Problema:** Assinatura do use case foi alterada, testes estão desatualizados.

**Arquivo:** `src/use-cases/core/sessions/refresh-session.spec.ts`

**Problemas específicos:**
- Linha 25: Expected 4 arguments, but got 3
- Múltiplas linhas: `sessionId` não existe em `RefreshSessionUseCaseRequest`

**Solução:** Verificar a nova assinatura do use case e atualizar os testes:

```typescript
// Verificar src/use-cases/core/sessions/refresh-session.ts
// E atualizar os testes para usar a nova interface
```

---

### 7. Corrigir `VolumeStatus` enum

**Problema:** Valores do enum não compatíveis.

**Arquivo:** `src/http/controllers/stock/volumes/v1-create-volume.controller.ts` (linha 51)

**Solução:** Verificar os valores válidos do enum `VolumeStatus` e ajustar.

---

### 8. Corrigir acesso a propriedade privada CNPJ

**Problema:** Tentativa de acessar `.value` que é privado.

**Arquivo:** `src/mappers/stock/product/product-to-dto.ts` (linha 142)

**Solução:** Usar o getter público ou método de acesso:
```typescript
// De:
cnpj.value

// Para:
cnpj.toString() // ou cnpj.getValue()
```

---

### 9. Corrigir `ItemStatus` enum

**Problema:** Valores do enum não compatíveis.

**Arquivo:** `src/utils/tests/factories/stock/create-item.e2e.ts` (linha 53)

**Solução:** Verificar valores válidos do enum `ItemStatus`.

---

### 10. Corrigir `PrismaZonesRepository`

**Problema:** Tipo nullable incompatível com Prisma.

**Arquivo:** `src/repositories/stock/prisma/prisma-zones-repository.ts` (linha 211)

**Solução:**
```typescript
// Usar Prisma.JsonNull para valores null
import { Prisma } from '@prisma/client'

layout: data.layout ?? Prisma.JsonNull
```

---

## 🟢 Prioridade Baixa

### 11. Atualizar testes de Volumes

**Problema:** Testes desatualizados após mudanças na interface.

**Arquivos afetados:**
- `src/use-cases/stock/volumes/create-volume.spec.ts`
- `src/use-cases/stock/volumes/update-volume.spec.ts`
- `src/use-cases/stock/volumes/delete-volume.spec.ts`
- E outros...

**Solução:** Após corrigir os repositórios, revisar e atualizar os testes.

---

## 📋 Checklist de Execução

### Fase 1: Infraestrutura (Crítico)
- [ ] Criar `src/repositories/pagination-params.ts`
- [ ] Corrigir imports em `prisma-volumes-repository.ts`
- [ ] Adicionar tipos explícitos onde necessário

### Fase 2: Repositórios
- [ ] Completar `InMemoryVolumesRepository` com métodos faltantes
- [ ] Corrigir enums no `prisma-audit-logs-repository.ts`
- [ ] Corrigir `prisma-zones-repository.ts`

### Fase 3: Domínio e Mappers
- [ ] Verificar e corrigir `VolumeStatus` enum
- [ ] Verificar e corrigir `ItemStatus` enum
- [ ] Corrigir acesso a `CNPJ.value`

### Fase 4: Testes
- [ ] Atualizar `refresh-session.spec.ts`
- [ ] Atualizar testes de volumes
- [ ] Rodar `npm test` e verificar se passou

### Fase 5: Validação Final
- [ ] Rodar `npx tsc --noEmit` (0 erros)
- [ ] Rodar `npm test` (todos passando)
- [ ] Rodar `npm run test:e2e` (todos passando)

---

## 🚀 Comandos Úteis

```bash
# Verificar erros TypeScript
npx tsc --noEmit

# Rodar testes unitários
npm test

# Rodar testes E2E
npm run test:e2e

# Rodar lint
npm run lint

# Corrigir lint automaticamente
npm run lint:fix
```

---

## 📅 Estimativa de Esforço

| Fase | Complexidade | Arquivos |
|------|--------------|----------|
| Fase 1 | Baixa | 3-4 |
| Fase 2 | Média | 3-4 |
| Fase 3 | Baixa | 3 |
| Fase 4 | Média | 10-15 |
| Fase 5 | Baixa | - |

---

*Documento gerado em: 2026-01-16*
