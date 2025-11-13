# Core - Auth (Autenticação)

Rotas para autenticação, registro de usuários e recuperação de senha.

## POST /v1/auth/login/password
Autenticar usuário com email e senha.

### Permissões
- Pública (sem autenticação)
- Rate limit: Auth (proteção contra brute force)

### Request Body
```typescript
{
  email: string;        // Email válido
  password: string;     // Senha (mínimo 1 caractere)
}
```

### Response 200 - Success
```typescript
{
  user: {
    id: string;
    username: string;
    email: string;
    role: string;       // "USER" | "MANAGER" | "ADMIN"
    lastLoginAt: Date | null;
    deletedAt?: Date | null;
    profile?: {
      id: string;
      userId: string;
      name: string;
      surname: string;
      birthday?: Date;
      location: string;
      bio: string;
      avatarUrl: string;
      createdAt: Date;
      updatedAt?: Date;
    } | null;
  };
  sessionId: string;
  token: string;
  refreshToken: string;
}
```

### Response 400 - Bad Request
```typescript
{
  message: string;
}
```

### Response 403 - Forbidden (User Blocked)
```typescript
{
  message: string;
  blockedUntil: Date;
}
```

### Response 404 - Not Found
```typescript
{
  message: string;
}
```

### Cookies
Define o cookie `refreshToken` (httpOnly, secure, sameSite).

---

## POST /v1/auth/register/password
Registrar um novo usuário.

### Permissões
- Pública (sem autenticação)
- Rate limit: Auth

### Request Body
```typescript
{
  email: string;               // Email válido
  password: string;            // Senha forte (min 8 caracteres, 1 maiúscula, 1 minúscula, 1 número)
  username?: string;           // Username (3-30 caracteres, opcional)
  profile?: {
    name?: string;             // Nome (2-100 caracteres)
    surname?: string;          // Sobrenome (2-100 caracteres)
    birthday?: Date;
    location?: string;         // Localização (máx 200 caracteres)
    bio?: string;              // Bio (máx 500 caracteres)
    avatarUrl?: string;        // URL do avatar
  };
}
```

### Response 201 - Created
```typescript
{
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    lastLoginAt: Date | null;
    deletedAt?: Date | null;
    profile?: {
      id: string;
      userId: string;
      name: string;
      surname: string;
      birthday?: Date;
      location: string;
      bio: string;
      avatarUrl: string;
      createdAt: Date;
      updatedAt?: Date;
    } | null;
  };
}
```

### Response 400 - Bad Request
```typescript
{
  message: string;
}
```

---

## POST /v1/auth/send/password
Enviar token de recuperação de senha por email.

### Permissões
- Pública (sem autenticação)
- Rate limit: Auth

### Request Body
```typescript
{
  email: string;  // Email válido
}
```

### Response 200 - Success
```typescript
{
  message: string;  // "Password reset token sent to email"
}
```

### Response 400 - Bad Request
```typescript
{
  message: string;
}
```

---

## POST /v1/auth/reset/password
Resetar senha usando token de recuperação.

### Permissões
- Pública (sem autenticação)
- Rate limit: Auth

### Request Body
```typescript
{
  token: string;        // Token recebido por email
  newPassword: string;  // Nova senha forte
}
```

### Response 200 - Success
```typescript
{
  message: string;  // "Password reset successfully"
}
```

### Response 400 - Bad Request
```typescript
{
  message: string;
}
```

---

## Exemplos de Uso

### Login
```typescript
const response = await fetch('http://localhost:3333/v1/auth/login/password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'usuario@example.com',
    password: 'MinhaSenh@123'
  })
});

const data = await response.json();
// Armazene o token para uso em requisições autenticadas
localStorage.setItem('token', data.token);
localStorage.setItem('refreshToken', data.refreshToken);
```

### Registro
```typescript
const response = await fetch('http://localhost:3333/v1/auth/register/password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'novousuario@example.com',
    password: 'MinhaSenh@123',
    username: 'novousuario',
    profile: {
      name: 'João',
      surname: 'Silva',
      bio: 'Desenvolvedor'
    }
  })
});

const data = await response.json();
```

### Recuperação de Senha
```typescript
// 1. Solicitar token
await fetch('http://localhost:3333/v1/auth/send/password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'usuario@example.com'
  })
});

// 2. Usuário recebe token por email e usa para resetar
await fetch('http://localhost:3333/v1/auth/reset/password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: 'token-recebido-por-email',
    newPassword: 'NovaSenha@123'
  })
});
```
