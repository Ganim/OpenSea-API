# Guia de Implementação - Módulo de Empresas (Enterprise)

## Overview

O módulo de Empresas permite gerenciar as empresas que fazem parte do sistema. Este guia contém as informações necessárias para integração com o frontend.

## Endpoints

### 1. Criar Empresa
- **Método**: POST
- **URL**: `/v1/hr/enterprises`
- **Autenticação**: Requerida (JWT)
- **Permissão**: MANAGER ou ADMIN
- **Status Code**: 201 (Sucesso), 400 (Erro), 401 (Não autenticado), 403 (Sem permissão)

#### Request Body
```json
{
  "legalName": "Tech Solutions LTDA",
  "cnpj": "12345678000100",
  "taxRegime": "Lucro Real",
  "phone": "1133334444",
  "address": "Rua das Flores",
  "addressNumber": "123",
  "complement": "Apto 101",
  "neighborhood": "Centro",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01310100",
  "country": "Brasil",
  "logoUrl": "https://example.com/logo.png"
}
```

#### Response
```json
{
  "enterprise": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "legalName": "Tech Solutions LTDA",
    "cnpj": "12345678000100",
    "taxRegime": "Lucro Real",
    "phone": "1133334444",
    "address": "Rua das Flores",
    "addressNumber": "123",
    "complement": "Apto 101",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310100",
    "country": "Brasil",
    "logoUrl": "https://example.com/logo.png",
    "createdAt": "2025-12-19T10:30:00Z",
    "updatedAt": "2025-12-19T10:30:00Z",
    "deletedAt": null
  }
}
```

### 2. Listar Empresas
- **Método**: GET
- **URL**: `/v1/hr/enterprises`
- **Autenticação**: Requerida (JWT)
- **Status Code**: 200 (Sucesso), 400 (Erro), 401 (Não autenticado)

#### Query Parameters
```
page=1&perPage=20&search=Tech&includeDeleted=false
```

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | 1 | Página da paginação |
| `perPage` | number | 20 | Itens por página (máximo 100) |
| `search` | string | - | Busca por razão social ou CNPJ |
| `includeDeleted` | boolean | false | Incluir empresas deletadas |

#### Response
```json
{
  "enterprises": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "legalName": "Tech Solutions LTDA",
      "cnpj": "12345678000100",
      "taxRegime": "Lucro Real",
      "phone": "1133334444",
      "address": "Rua das Flores",
      "addressNumber": "123",
      "complement": "Apto 101",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310100",
      "country": "Brasil",
      "logoUrl": "https://example.com/logo.png",
      "createdAt": "2025-12-19T10:30:00Z",
      "updatedAt": "2025-12-19T10:30:00Z",
      "deletedAt": null
    }
  ],
  "total": 1,
  "page": 1,
  "perPage": 20
}
```

### 3. Obter Empresa por ID
- **Método**: GET
- **URL**: `/v1/hr/enterprises/:id`
- **Autenticação**: Requerida (JWT)
- **Status Code**: 200 (Sucesso), 400 (Erro), 401 (Não autenticado)

#### Response
```json
{
  "enterprise": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "legalName": "Tech Solutions LTDA",
    "cnpj": "12345678000100",
    "taxRegime": "Lucro Real",
    "phone": "1133334444",
    "address": "Rua das Flores",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310100",
    "country": "Brasil",
    "logoUrl": "https://example.com/logo.png",
    "createdAt": "2025-12-19T10:30:00Z",
    "updatedAt": "2025-12-19T10:30:00Z",
    "deletedAt": null
  }
}
```

### 4. Atualizar Empresa
- **Método**: PUT
- **URL**: `/v1/hr/enterprises/:id`
- **Autenticação**: Requerida (JWT)
- **Permissão**: MANAGER ou ADMIN
- **Status Code**: 200 (Sucesso), 400 (Erro), 401 (Não autenticado), 403 (Sem permissão)

#### Request Body (todos os campos opcionais)
```json
{
  "legalName": "Tech Solutions Updated LTDA",
  "taxRegime": "Simples Nacional",
  "phone": "1144445555",
  "address": "Nova Rua",
  "city": "Rio de Janeiro",
  "state": "RJ",
  "zipCode": "20040020",
  "logoUrl": "https://example.com/new-logo.png"
}
```

#### Response
Mesmo formato da resposta de Get Enterprise por ID

### 5. Deletar Empresa
- **Método**: DELETE
- **URL**: `/v1/hr/enterprises/:id`
- **Autenticação**: Requerida (JWT)
- **Permissão**: MANAGER ou ADMIN
- **Status Code**: 200 (Sucesso), 400 (Erro), 401 (Não autenticado), 403 (Sem permissão)

#### Response
```json
{
  "success": true
}
```

### 6. Verificar Disponibilidade de CNPJ
- **Método**: POST
- **URL**: `/v1/hr/enterprises/check-cnpj`
- **Autenticação**: Requerida (JWT)
- **Status Code**: 200 (Sucesso), 400 (Erro), 401 (Não autenticado)

#### Request Body
```json
{
  "cnpj": "12345678000100"
}
```

#### Response
```json
{
  "exists": true,
  "enterpriseId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Ou quando não existe:
```json
{
  "exists": false
}
```

## Schemas de Entrada

### Criar/Atualizar Empresa

| Campo | Tipo | Obrigatório | Restrições |
|-------|------|-------------|-----------|
| `legalName` | string | Sim (create) | Mín 2, Máx 256 caracteres |
| `cnpj` | string | Sim (create) | Formato: 14 dígitos ou XX.XXX.XXX/XXXX-XX |
| `taxRegime` | string | Não | Máx 128 caracteres |
| `phone` | string | Não | Máx 20 caracteres |
| `address` | string | Não | Máx 256 caracteres |
| `addressNumber` | string | Não | Máx 16 caracteres |
| `complement` | string | Não | Máx 128 caracteres |
| `neighborhood` | string | Não | Máx 128 caracteres |
| `city` | string | Não | Máx 128 caracteres |
| `state` | string | Não | Exatamente 2 caracteres (UF) |
| `zipCode` | string | Não | Máx 10 caracteres |
| `country` | string | Não | Padrão: "Brasil", Máx 64 caracteres |
| `logoUrl` | string | Não | URL válida, Máx 512 caracteres |

## Regras de Negócio

1. **CNPJ Único**: O CNPJ deve ser único entre empresas ativas (deletadas não são consideradas)
2. **Soft Delete**: Empresas não são removidas fisicamente, apenas marcadas como deletadas
3. **Dados Opcionais**: Campos não obrigatórios podem gerar pendências no sistema (conforme definido nas políticas)
4. **Auditoria**: Todas as ações são registradas automaticamente no sistema de auditoria

## Permissões Necessárias

| Ação | Permissão | Papel |
|------|-----------|-------|
| Criar | `enterprise.create` | MANAGER, ADMIN |
| Listar | `enterprise.list` | MANAGER, ADMIN, USER |
| Visualizar | `enterprise.view` | MANAGER, ADMIN, USER |
| Atualizar | `enterprise.update` | MANAGER, ADMIN |
| Deletar | `enterprise.delete` | MANAGER, ADMIN |
| Check CNPJ | `enterprise.check_cnpj` | MANAGER, ADMIN, USER |

## Exemplos de Uso

### JavaScript/TypeScript

#### Criar Empresa
```typescript
const response = await fetch('/v1/hr/enterprises', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    legalName: 'Tech Solutions LTDA',
    cnpj: '12345678000100',
    taxRegime: 'Lucro Real',
    phone: '1133334444'
  })
});

const data = await response.json();
console.log(data.enterprise);
```

#### Listar Empresas
```typescript
const response = await fetch('/v1/hr/enterprises?page=1&perPage=20&search=Tech', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.enterprises);
console.log(`Total: ${data.total}`);
```

#### Verificar CNPJ
```typescript
const response = await fetch('/v1/hr/enterprises/check-cnpj', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ cnpj: '12345678000100' })
});

const data = await response.json();
if (data.exists) {
  console.log(`Empresa já cadastrada: ${data.enterpriseId}`);
} else {
  console.log('CNPJ disponível');
}
```

## Tratamento de Erros

### Erros Comuns

| Status | Mensagem | Causa |
|--------|----------|-------|
| 400 | `Enterprise with this CNPJ already exists` | Tentativa de criar empresa com CNPJ duplicado |
| 400 | Erro de validação | Campo inválido ou obrigatório faltando |
| 401 | `Unauthorized` | Token ausente ou inválido |
| 403 | `Forbidden` | Usuário sem permissão para a ação |

## Notas Importantes

- Todas as datas são retornadas em ISO 8601 (UTC)
- O campo `deletedAt` é `null` para empresas ativas
- Empresas deletadas não aparecem nas listagens por padrão, a menos que `includeDeleted=true`
- As operações de criação, atualização e deleção requerem permissão de MANAGER ou ADMIN
- A busca é case-insensitive para `legalName` e `cnpj`
