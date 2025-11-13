# Core - Users (Administração de Usuários)

Rotas para administração de usuários. Requer permissões de MANAGER ou ADMIN.

## GET /v1/users
Listar todos os usuários.

**Permissões:** MANAGER  
**Rate Limit:** Mutation

### Response 200
```typescript
{
  users: Array<{
    id: string;
    username: string;
    email: string;
    role: string;
    lastLoginAt: Date | null;
    profile?: object | null;
  }>;
}
```

---

## GET /v1/users/:userId
Obter usuário por ID.

**Permissões:** Autenticado  
**Rate Limit:** Query

### Params
- `userId` (string, UUID)

### Response 200
```typescript
{
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    lastLoginAt: Date | null;
    profile?: object | null;
  };
}
```

---

## GET /v1/users/email/:email
Obter usuário por email.

**Permissões:** Autenticado  
**Rate Limit:** Query

### Params
- `email` (string)

### Response 200
```typescript
{
  user: object;
}
```

---

## GET /v1/users/username/:username
Obter usuário por username.

**Permissões:** Autenticado  
**Rate Limit:** Query

### Params
- `username` (string)

### Response 200
```typescript
{
  user: object;
}
```

---

## GET /v1/users/role/:role
Listar usuários por role.

**Permissões:** ADMIN  
**Rate Limit:** Admin

### Params
- `role` (string: "USER" | "MANAGER" | "ADMIN")

### Response 200
```typescript
{
  users: Array<object>;
}
```

---

## GET /v1/users/online
Listar usuários online.

**Permissões:** Autenticado  
**Rate Limit:** Query

### Response 200
```typescript
{
  users: Array<object>;
}
```

---

## POST /v1/users
Criar novo usuário.

**Permissões:** MANAGER  
**Rate Limit:** Mutation

### Request Body
```typescript
{
  username: string;     // 3-30 caracteres
  email: string;
  password: string;     // Senha forte
  role?: "USER" | "MANAGER" | "ADMIN";  // Padrão: "USER"
}
```

### Response 201
```typescript
{
  user: object;
}
```

---

## PATCH /v1/users/:userId/email
Alterar email de um usuário.

**Permissões:** ADMIN  
**Rate Limit:** Admin

### Params
- `userId` (string, UUID)

### Request Body
```typescript
{
  email: string;
}
```

### Response 200
```typescript
{
  user: object;
}
```

---

## PATCH /v1/users/:userId/username
Alterar username de um usuário.

**Permissões:** ADMIN  
**Rate Limit:** Admin

### Params
- `userId` (string, UUID)

### Request Body
```typescript
{
  username: string;
}
```

### Response 200
```typescript
{
  user: object;
}
```

---

## PATCH /v1/users/:userId/password
Alterar senha de um usuário.

**Permissões:** ADMIN  
**Rate Limit:** Admin

### Params
- `userId` (string, UUID)

### Request Body
```typescript
{
  newPassword: string;
}
```

### Response 200
```typescript
{
  message: string;
}
```

---

## PATCH /v1/users/:userId/role
Alterar role de um usuário.

**Permissões:** ADMIN  
**Rate Limit:** Admin

### Params
- `userId` (string, UUID)

### Request Body
```typescript
{
  role: "USER" | "MANAGER" | "ADMIN";
}
```

### Response 200
```typescript
{
  user: object;
}
```

---

## PATCH /v1/users/:userId
Atualizar perfil de um usuário.

**Permissões:** ADMIN  
**Rate Limit:** Admin

### Params
- `userId` (string, UUID)

### Request Body
```typescript
{
  name?: string;
  surname?: string;
  birthday?: Date;
  location?: string;
  bio?: string;
  avatarUrl?: string;
}
```

### Response 200
```typescript
{
  profile: object;
}
```

---

## DELETE /v1/users/:userId
Excluir usuário.

**Permissões:** ADMIN  
**Rate Limit:** Admin

### Params
- `userId` (string, UUID)

### Response 204
Sem corpo de resposta.

---

## Exemplo de Uso

```typescript
// Listar todos os usuários (MANAGER)
const users = await fetch('http://localhost:3333/v1/users', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Criar usuário (MANAGER)
const newUser = await fetch('http://localhost:3333/v1/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'novousuario',
    email: 'novo@example.com',
    password: 'Senha@123',
    role: 'USER'
  })
});

// Alterar role (ADMIN)
await fetch('http://localhost:3333/v1/users/user-id/role', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ role: 'MANAGER' })
});
```
