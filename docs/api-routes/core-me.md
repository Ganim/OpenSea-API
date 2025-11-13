# Core - Me (Perfil do Usuário Autenticado)

Rotas para o usuário autenticado gerenciar seu próprio perfil.

## GET /v1/me
Obter informações do usuário autenticado.

### Permissões
- Autenticado (Bearer Token)

### Headers
```
Authorization: Bearer {token}
```

### Response 200 - Success
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

### Response 401 - Unauthorized
```typescript
{
  message: string;
}
```

---

## PATCH /v1/me
Atualizar perfil do usuário autenticado.

### Permissões
- Autenticado (Bearer Token)

### Headers
```
Authorization: Bearer {token}
```

### Request Body
```typescript
{
  name?: string;       // Nome (2-100 caracteres)
  surname?: string;    // Sobrenome (2-100 caracteres)
  birthday?: Date;
  location?: string;   // Localização (máx 200 caracteres)
  bio?: string;        // Bio (máx 500 caracteres)
  avatarUrl?: string;  // URL do avatar
}
```

### Response 200 - Success
```typescript
{
  profile: {
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

## PATCH /v1/me/email
Alterar email do usuário autenticado.

### Permissões
- Autenticado (Bearer Token)

### Headers
```
Authorization: Bearer {token}
```

### Request Body
```typescript
{
  email: string;  // Novo email válido
}
```

### Response 200 - Success
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

### Response 400 - Bad Request
```typescript
{
  message: string;  // Ex: "Email already in use"
}
```

---

## PATCH /v1/me/username
Alterar username do usuário autenticado.

### Permissões
- Autenticado (Bearer Token)

### Headers
```
Authorization: Bearer {token}
```

### Request Body
```typescript
{
  username: string;  // Novo username (3-30 caracteres, alfanumérico e underscores)
}
```

### Response 200 - Success
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

### Response 400 - Bad Request
```typescript
{
  message: string;  // Ex: "Username already taken"
}
```

---

## PATCH /v1/me/password
Alterar senha do usuário autenticado.

### Permissões
- Autenticado (Bearer Token)

### Headers
```
Authorization: Bearer {token}
```

### Request Body
```typescript
{
  oldPassword: string;  // Senha atual
  newPassword: string;  // Nova senha forte (min 8 caracteres, 1 maiúscula, 1 minúscula, 1 número)
}
```

### Response 200 - Success
```typescript
{
  message: string;  // "Password changed successfully"
}
```

### Response 400 - Bad Request
```typescript
{
  message: string;  // Ex: "Invalid old password"
}
```

---

## DELETE /v1/me
Excluir conta do usuário autenticado (soft delete).

### Permissões
- Autenticado (Bearer Token)

### Headers
```
Authorization: Bearer {token}
```

### Response 204 - No Content
Sem corpo de resposta.

### Response 401 - Unauthorized
```typescript
{
  message: string;
}
```

---

## Exemplos de Uso

### Obter Perfil
```typescript
const response = await fetch('http://localhost:3333/v1/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  }
});

const data = await response.json();
console.log(data.user);
```

### Atualizar Perfil
```typescript
const response = await fetch('http://localhost:3333/v1/me', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'João',
    surname: 'Silva',
    bio: 'Desenvolvedor Full Stack',
    location: 'São Paulo, Brasil'
  })
});

const data = await response.json();
```

### Alterar Email
```typescript
const response = await fetch('http://localhost:3333/v1/me/email', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'novoemail@example.com'
  })
});

const data = await response.json();
```

### Alterar Senha
```typescript
const response = await fetch('http://localhost:3333/v1/me/password', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    oldPassword: 'SenhaAntiga@123',
    newPassword: 'NovaSenha@123'
  })
});

const data = await response.json();
```

### Excluir Conta
```typescript
const response = await fetch('http://localhost:3333/v1/me', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
  }
});

// Status 204 - conta excluída
```
