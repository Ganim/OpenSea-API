# Guia de Implementação do Refresh Token - Backend OpenSea API

## 📋 Visão Geral

O backend OpenSea API implementa um sistema de autenticação com **dois tipos de tokens**:

1. **Access Token (JWT)** - Expira em 30 minutos, usado para autenticar requisições
2. **Refresh Token (JWT)** - Expira em 7 dias, usado exclusivamente para renovar o access token

---

## 🔐 Como Funciona

### 1. Login (POST /v1/auth/login/password)

**Request:**
```typescript
POST http://localhost:3333/v1/auth/login/password
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Response (200):**
```typescript
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "role": "USER" | "MANAGER" | "ADMIN",
    "lastLoginAt": "Date",
    "profile": { ... }
  },
  "sessionId": "uuid",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",      // Access Token (30min)
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // Refresh Token (7 dias)
}
```

**Importante:**
- O `refreshToken` também é enviado como **cookie httpOnly** automaticamente
- O `token` (access token) deve ser armazenado no localStorage/sessionStorage
- O `refreshToken` pode ser armazenado no localStorage OU recuperado do cookie

---

### 2. Renovar Sessão (PATCH /v1/sessions/refresh)

**ATENÇÃO:** Esta rota requer o **REFRESH TOKEN** no header Authorization, NÃO o access token!

**Request:**
```typescript
PATCH http://localhost:3333/v1/sessions/refresh
Authorization: Bearer {refreshToken}  // ⚠️ USA O REFRESH TOKEN AQUI!
```

**Response (200 OK):**
```typescript
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",      // Novo Access Token (30min)
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // Novo Refresh Token (7 dias)
}
```

**Comportamento do Backend:**
1. Valida o refresh token enviado
2. Revoga o refresh token antigo (segurança)
3. Cria um novo refresh token (7 dias de validade)
4. Gera um novo access token (30 minutos de validade)
5. Atualiza a sessão no banco de dados
6. Retorna os novos tokens no corpo da resposta
7. Define o novo refresh token como cookie httpOnly

**Importante:**
- Você deve **substituir** os tokens antigos pelos novos recebidos
- O refresh token antigo é **revogado** e não pode mais ser usado
- O novo refresh token também é enviado como cookie httpOnly

---

## 💡 Implementação Completa no Front-End

### Estrutura Recomendada

```typescript
// services/auth.service.ts

interface AuthTokens {
  token: string;        // Access token (30 min)
  refreshToken: string; // Refresh token (7 dias)
}

class AuthService {
  private static TOKEN_KEY = 'token';
  private static REFRESH_TOKEN_KEY = 'refreshToken';

  // Salvar tokens após login
  static saveTokens(tokens: AuthTokens) {
    localStorage.setItem(this.TOKEN_KEY, tokens.token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  // Obter access token
  static getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Obter refresh token
  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Renovar sessão
  static async refreshSession(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('http://localhost:3333/v1/sessions/refresh', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${refreshToken}`, // ⚠️ USA REFRESH TOKEN!
      },
    });

    if (!response.ok) {
      throw new Error('Failed to refresh session');
    }

    // Backend retorna os novos tokens
    const data = await response.json();
    this.saveTokens({
      token: data.token,
      refreshToken: data.refreshToken,
    });
  }

  // Limpar tokens no logout
  static clearTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // Verificar se o token está próximo de expirar
  static isTokenExpiringSoon(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000; // Converter para ms
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      return (expiresAt - now) < fiveMinutes;
    } catch {
      return true;
    }
  }
}
```

### Interceptor HTTP (Auto-Refresh)

```typescript
// api/interceptor.ts

async function apiRequest(url: string, options: RequestInit = {}) {
  // Verificar se precisa renovar antes da requisição
  if (AuthService.isTokenExpiringSoon()) {
    try {
      await AuthService.refreshSession();
    } catch (error) {
      // Falhou ao renovar - fazer logout
      AuthService.clearTokens();
      window.location.href = '/login';
      throw error;
    }
  }

  // Adicionar access token no header
  const token = AuthService.getAccessToken();
  const headers = {
    ...options.headers,
    'Authorization': token ? `Bearer ${token}` : '',
  };

  const response = await fetch(url, { ...options, headers });

  // Se retornar 401, tentar renovar uma vez
  if (response.status === 401) {
    try {
      await AuthService.refreshSession();
      
      // Tentar novamente com novo token
      const newToken = AuthService.getAccessToken();
      const retryHeaders = {
        ...options.headers,
        'Authorization': `Bearer ${newToken}`,
      };
      
      return await fetch(url, { ...options, headers: retryHeaders });
    } catch (error) {
      // Falhou - fazer logout
      AuthService.clearTokens();
      window.location.href = '/login';
      throw error;
    }
  }

  return response;
}
```

---

## 🔍 Detalhes Técnicos

### Estrutura dos Tokens JWT

**Access Token (30 minutos):**
```json
{
  "sub": "user-uuid",
  "role": "USER",
  "sessionId": "session-uuid",
  "iat": 1234567890,
  "exp": 1234569690
}
```

**Refresh Token (7 dias):**
```json
{
  "sub": "user-uuid",
  "role": "USER",
  "sessionId": "session-uuid",
  "jti": "token-uuid",
  "iat": 1234567890,
  "exp": 1235172690
}
```

### Fluxo de Segurança

1. **Login** → Recebe ambos os tokens
2. **Requisições normais** → Usa access token
3. **Access token expira (30min)** → Usa refresh token para renovar
4. **Refresh** → Revoga refresh token antigo, cria novo
5. **Refresh token expira (7 dias)** → Usuário precisa fazer login novamente

---

## ❌ Erros Comuns

### Erro 1: Usando Access Token para Renovar
```typescript
// ❌ ERRADO
fetch('/v1/sessions/refresh', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// ✅ CORRETO
fetch('/v1/sessions/refresh', {
  headers: { 'Authorization': `Bearer ${refreshToken}` }
});
```

### Erro 2: Não Substituir os Tokens Recebidos
```typescript
// ❌ ERRADO - Não salvar os novos tokens
const response = await fetch('/v1/sessions/refresh', ...);
await response.json(); // Ignorar os tokens

// ✅ CORRETO - Substituir pelos novos tokens
const response = await fetch('/v1/sessions/refresh', ...);
const { token, refreshToken } = await response.json();
localStorage.setItem('token', token);
localStorage.setItem('refreshToken', refreshToken);
```

### Erro 3: Não Renovar Proativamente
```typescript
// ❌ ERRADO - Espera dar erro 401
// Requisição → 401 → Renovar → Tentar novamente

// ✅ CORRETO - Renova antes de expirar
if (isTokenExpiringSoon()) {
  await refreshSession();
}
// Fazer requisição
```

---

## 🎯 Checklist de Implementação

- [ ] Armazenar AMBOS os tokens após login
- [ ] Usar **access token** para requisições normais
- [ ] Usar **refresh token** APENAS para renovar sessão
- [ ] **Substituir** os tokens antigos pelos novos após refresh
- [ ] Implementar verificação de expiração (5 minutos antes)
- [ ] Renovar proativamente antes das requisições
- [ ] Implementar fallback para 401 (tentar renovar)
- [ ] Fazer logout se refresh falhar

---

## 📞 Endpoints Relacionados

| Rota | Método | Token Usado | Descrição |
|------|--------|-------------|-----------|
| `/v1/auth/login/password` | POST | Nenhum | Login inicial |
| `/v1/sessions/refresh` | PATCH | **Refresh Token** | Renovar sessão |
| `/v1/sessions/logout` | POST | Access Token | Fazer logout |
| `/v1/me` | GET | Access Token | Dados do usuário |

---

## 🚨 Perguntas para a IA do Front-End

Use estas perguntas para ajudar a IA a implementar corretamente:

1. **"Estou usando refresh token ou access token para renovar a sessão?"**
   - Resposta correta: Refresh Token

2. **"O backend retorna novos tokens no response do refresh?"**
   - Resposta: Sim, retorna `{ token, refreshToken }` com status 200

3. **"Quando devo renovar a sessão?"**
   - Resposta: 5 minutos antes do access token expirar OU quando receber 401

4. **"O que fazer se o refresh token expirar?"**
   - Resposta: Fazer logout e redirecionar para login

5. **"Preciso salvar os novos tokens após refresh?"**
   - Resposta: Sim, SEMPRE substituir os tokens antigos pelos novos recebidos

---

## 📝 Exemplo Completo de Fluxo

```typescript
// 1. Login
const loginResponse = await fetch('/v1/auth/login/password', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

const { token, refreshToken, user } = await loginResponse.json();
localStorage.setItem('token', token);
localStorage.setItem('refreshToken', refreshToken);

// 2. Fazer requisições (com auto-refresh)
async function fetchProducts() {
  // Verificar se precisa renovar
  if (isTokenExpiringSoon()) {
    await refreshSession(); // Usa refreshToken internamente
  }

  // Fazer requisição com access token
  const response = await fetch('/v1/products', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Se falhar com 401, tentar renovar
  if (response.status === 401) {
    await refreshSession();
    // Tentar novamente...
  }

  return response.json();
}

// 3. Renovar sessão (função interna)
async function refreshSession() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('/v1/sessions/refresh', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${refreshToken}` // ⚠️ REFRESH TOKEN
    }
  });

  if (!response.ok) {
    throw new Error('Refresh failed');
  }

  // Receber e salvar os novos tokens
  const { token, refreshToken: newRefreshToken } = await response.json();
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', newRefreshToken);
}
```

---

**Data de criação:** 16 de novembro de 2025  
**Versão da API:** 3.5.0  
**Backend:** OpenSea API
