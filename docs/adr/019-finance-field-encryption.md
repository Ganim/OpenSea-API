# ADR-019: Criptografia AES-GCM para dados financeiros sensíveis

## Status: Accepted

## Date: 2026-03-10

## Context

O módulo financeiro armazena dados de boleto (barcode, linha digitável) que são financeiramente sensíveis. Um vazamento de dados exporia informações que permitiriam pagamentos fraudulentos. Campos como nomes de fornecedores e clientes, por outro lado, são dados comerciais semipúblicos que precisam ser buscáveis via queries SQL.

A criptografia at-rest do banco de dados (TDE) protege contra roubo físico do disco, mas não contra SQL injection, backups vazados ou acesso indevido por administradores de banco.

## Decision

Usar criptografia field-level AES-256-GCM via `FieldCipherService` (`src/services/security/field-cipher-service.ts`) para campos financeiramente sensíveis:

- `boletoBarcode` — código de barras do boleto
- `boletoDigitLine` — linha digitável do boleto

Campos mantidos em plaintext por serem dados comerciais ou necessários para busca:

- `supplierName`, `customerName` — dados comerciais, necessários em filtros e buscas
- `description`, `notes` — texto livre sem valor financeiro direto
- `expectedAmount`, `actualAmount` — valores numéricos usados em cálculos e agregações SQL

### Implementação

O `FieldCipherService` usa `node-forge` com AES-256-GCM:

- IV aleatório de 12 bytes por operação de encrypt
- Tag de autenticação de 16 bytes (GCM)
- Formato armazenado: `iv:ciphertext:tag` (base64)
- Chave de criptografia via variável de ambiente `FIELD_CIPHER_KEY`

Encrypt/decrypt ocorre nas camadas de repositório Prisma (`prisma-finance-entries-repository.ts`, `prisma-loans-repository.ts`, `prisma-consortia-repository.ts`), transparente para use cases e controllers.

## Consequences

**Positivo:**

- Boletos protegidos contra vazamento de dados mesmo em cenários de SQL injection ou backup exposto
- Busca textual funciona normalmente em campos não-criptografados (nomes, descrição)
- GCM garante integridade (tamper detection) além de confidencialidade
- Transparente para camadas superiores (use cases, controllers)

**Negativo:**

- Overhead de encrypt/decrypt em cada leitura/escrita de campos sensíveis
- Campos criptografados não podem ser usados em queries SQL (WHERE, ORDER BY)
- Rotação de chave requer migração de todos os registros existentes
- Perda da `FIELD_CIPHER_KEY` torna dados de boleto irrecuperáveis
