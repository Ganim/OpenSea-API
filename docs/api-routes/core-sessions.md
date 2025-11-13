# Core - Sessions (Gerenciamento de Sessões)

Rotas para gerenciar sessões de usuários.

## GET /v1/sessions/user/:userId
Listar sessões de um usuário.

**Permissões:** MANAGER

### Params
- `userId` (string, UUID)

### Response 200
```typescript
{
  sessions: Array<{
    id: string;
    userId: string;
    isActive: boolean;
    createdAt: Date;
    expiresAt: Date;
    lastActivityAt: Date;
  }>;
}
```

---

## GET /v1/sessions/user/:userId/by-date
Listar sessões de um usuário por data.

**Permissões:** MANAGER

### Params
- `userId` (string, UUID)

### Query Params
```typescript
{
  startDate?: Date;
  endDate?: Date;
}
```

### Response 200
```typescript
{
  sessions: Array<object>;
}
```

---

## GET /v1/sessions
Listar minhas sessões.

**Permissões:** Autenticado

### Response 200
```typescript
{
  sessions: Array<object>;
}
```

---

## GET /v1/sessions/active
Listar todas as sessões ativas.

**Permissões:** MANAGER

### Response 200
```typescript
{
  sessions: Array<object>;
}
```

---

## POST /v1/sessions/refresh
Renovar sessão usando refresh token.

**Permissões:** Autenticado

### Request Body
```typescript
{
  refreshToken: string;
}
```

### Response 200
```typescript
{
  token: string;
  refreshToken: string;
  sessionId: string;
}
```

---

## POST /v1/sessions/logout
Fazer logout da sessão atual.

**Permissões:** Autenticado

### Response 200
```typescript
{
  message: string;  // "Logout successful"
}
```

---

## POST /v1/sessions/:sessionId/revoke
Revogar uma sessão específica.

**Permissões:** MANAGER

### Params
- `sessionId` (string, UUID)

### Response 200
```typescript
{
  message: string;  // "Session revoked"
}
```

---

## POST /v1/sessions/:sessionId/expire
Expirar uma sessão específica.

**Permissões:** MANAGER

### Params
- `sessionId` (string, UUID)

### Response 200
```typescript
{
  message: string;  // "Session expired"
}
```

---

## Exemplo de Uso

```typescript
// Renovar token
const response = await fetch('http://localhost:3333/v1/sessions/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refreshToken')
  })
});

const data = await response.json();
localStorage.setItem('token', data.token);
localStorage.setItem('refreshToken', data.refreshToken);

// Logout
await fetch('http://localhost:3333/v1/sessions/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Listar minhas sessões
const sessions = await fetch('http://localhost:3333/v1/sessions', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```
