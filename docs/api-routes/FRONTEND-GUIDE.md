# Guia de Integração Front-End

Este guia fornece exemplos práticos de como integrar o front-end com a API OpenSea.

## Configuração Inicial

### 1. Configurar Cliente HTTP

```typescript
// api/client.ts
const API_BASE_URL = 'http://localhost:3333';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (requiresAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
```

### 2. Serviço de Autenticação

```typescript
// services/auth.service.ts
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  username?: string;
  profile?: {
    name?: string;
    surname?: string;
    bio?: string;
  };
}

interface AuthResponse {
  user: any;
  sessionId: string;
  token: string;
  refreshToken: string;
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/v1/auth/login/password', {
      method: 'POST',
      requiresAuth: false,
      body: JSON.stringify(credentials),
    });

    // Armazenar tokens
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  static async register(data: RegisterData): Promise<{ user: any }> {
    const response = await apiRequest<{ user: any }>('/v1/auth/register/password', {
      method: 'POST',
      requiresAuth: false,
      body: JSON.stringify(data),
    });

    return response;
  }

  static async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiRequest<AuthResponse>('/v1/sessions/refresh', {
      method: 'POST',
      requiresAuth: false,
      body: JSON.stringify({ refreshToken }),
    });

    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);

    return response;
  }

  static async logout(): Promise<void> {
    try {
      await apiRequest('/v1/sessions/logout', {
        method: 'POST',
      });
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  static isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  static getCurrentUser(): any | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}
```

### 3. Serviços de Produtos

```typescript
// services/products.service.ts
interface Product {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  unitOfMeasure: 'METERS' | 'KILOGRAMS' | 'UNITS';
  attributes: Record<string, any>;
  templateId: string;
  supplierId?: string;
  manufacturerId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface CreateProductData {
  name: string;
  code: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  unitOfMeasure: 'METERS' | 'KILOGRAMS' | 'UNITS';
  attributes?: Record<string, any>;
  templateId: string;
  supplierId?: string;
  manufacturerId?: string;
}

export class ProductsService {
  static async list(): Promise<Product[]> {
    const response = await apiRequest<{ products: Product[] }>('/v1/products');
    return response.products;
  }

  static async getById(id: string): Promise<Product> {
    const response = await apiRequest<{ product: Product }>(`/v1/products/${id}`);
    return response.product;
  }

  static async create(data: CreateProductData): Promise<Product> {
    const response = await apiRequest<{ product: Product }>('/v1/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.product;
  }

  static async update(id: string, data: Partial<CreateProductData>): Promise<Product> {
    const response = await apiRequest<{ product: Product }>(`/v1/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.product;
  }

  static async delete(id: string): Promise<void> {
    await apiRequest<void>(`/v1/products/${id}`, {
      method: 'DELETE',
    });
  }
}
```

### 4. Serviço de Pedidos de Venda

```typescript
// services/sales-orders.service.ts
interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  notes?: string;
  items: Array<{
    id: string;
    variantId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    totalPrice: number;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateSalesOrderData {
  customerId: string;
  orderNumber: string;
  status?: 'DRAFT' | 'PENDING' | 'CONFIRMED';
  discount?: number;
  notes?: string;
  items: Array<{
    variantId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    notes?: string;
  }>;
}

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class SalesOrdersService {
  static async list(params?: ListParams): Promise<SalesOrder[]> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const query = queryParams.toString();
    const endpoint = query ? `/v1/sales-orders?${query}` : '/v1/sales-orders';

    const response = await apiRequest<{ salesOrders: SalesOrder[] }>(endpoint);
    return response.salesOrders;
  }

  static async getById(id: string): Promise<SalesOrder> {
    const response = await apiRequest<{ salesOrder: SalesOrder }>(`/v1/sales-orders/${id}`);
    return response.salesOrder;
  }

  static async create(data: CreateSalesOrderData): Promise<SalesOrder> {
    const response = await apiRequest<{ salesOrder: SalesOrder }>('/v1/sales-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.salesOrder;
  }

  static async updateStatus(
    id: string,
    status: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'
  ): Promise<SalesOrder> {
    const response = await apiRequest<{ salesOrder: SalesOrder }>(
      `/v1/sales-orders/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
    return response.salesOrder;
  }

  static async cancel(id: string): Promise<SalesOrder> {
    const response = await apiRequest<{ salesOrder: SalesOrder }>(
      `/v1/sales-orders/${id}/cancel`,
      {
        method: 'POST',
      }
    );
    return response.salesOrder;
  }
}
```

## Exemplos de Uso em Componentes React

### Componente de Login

```tsx
// components/LoginForm.tsx
import { useState } from 'react';
import { AuthService } from '../services/auth.service';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await AuthService.login({ email, password });
      // Redirecionar para dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
```

### Componente de Lista de Produtos

```tsx
// components/ProductList.tsx
import { useEffect, useState } from 'react';
import { ProductsService } from '../services/products.service';

export function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await ProductsService.list();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;

    try {
      await ProductsService.delete(id);
      await loadProducts(); // Recarregar lista
    } catch (err) {
      alert('Erro ao excluir produto');
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h1>Produtos</h1>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.code}</td>
              <td>{product.name}</td>
              <td>{product.status}</td>
              <td>
                <button onClick={() => handleDelete(product.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Hook Personalizado para Dados

```tsx
// hooks/useProducts.ts
import { useState, useEffect } from 'react';
import { ProductsService } from '../services/products.service';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await ProductsService.list();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refresh: loadProducts,
  };
}

// Uso:
// const { products, loading, error, refresh } = useProducts();
```

## Interceptor de Requisições (Auto-refresh de Token)

```typescript
// api/client-with-refresh.ts
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function apiRequestWithAutoRefresh<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  try {
    return await apiRequest<T>(endpoint, options);
  } catch (error) {
    if (error instanceof Error && error.message.includes('401')) {
      // Token expirado, tentar renovar
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const { token } = await AuthService.refreshToken();
          isRefreshing = false;
          onRefreshed(token);
          
          // Tentar novamente com novo token
          return await apiRequest<T>(endpoint, options);
        } catch (refreshError) {
          isRefreshing = false;
          // Redirecionar para login
          window.location.href = '/login';
          throw refreshError;
        }
      } else {
        // Aguardar refresh em andamento
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(() => {
            apiRequest<T>(endpoint, options).then(resolve).catch(reject);
          });
        });
      }
    }
    
    throw error;
  }
}
```

## Tratamento de Erros Global

```typescript
// utils/error-handler.ts
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    // Erros de rede
    if (error.message.includes('Failed to fetch')) {
      return 'Erro de conexão. Verifique sua internet.';
    }
    
    // Erros HTTP
    if (error.message.includes('401')) {
      return 'Sessão expirada. Faça login novamente.';
    }
    
    if (error.message.includes('403')) {
      return 'Você não tem permissão para esta ação.';
    }
    
    if (error.message.includes('404')) {
      return 'Recurso não encontrado.';
    }
    
    if (error.message.includes('500')) {
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    }
    
    return error.message;
  }
  
  return 'Erro desconhecido.';
}
```

## Boas Práticas

1. **Sempre trate erros**: Use try/catch e exiba mensagens amigáveis ao usuário
2. **Use TypeScript**: Defina interfaces para todos os tipos de dados da API
3. **Centralize a configuração**: Mantenha a URL base e configurações em um só lugar
4. **Implemente auto-refresh**: Renove tokens automaticamente antes que expirem
5. **Loading states**: Mostre indicadores de carregamento durante requisições
6. **Validação no cliente**: Valide dados antes de enviar para a API
7. **Cache quando apropriado**: Use SWR, React Query ou cache manual para dados estáticos
8. **Teste os serviços**: Crie testes unitários para seus serviços de API

## Bibliotecas Recomendadas

- **React Query** ou **SWR**: Para cache e sincronização de dados
- **Axios**: Cliente HTTP alternativo ao fetch
- **Zod**: Para validação de dados da API
- **React Hook Form**: Para gerenciamento de formulários
