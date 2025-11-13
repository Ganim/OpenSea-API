# Health Check

Rota para verificar o status da API.

## GET /health
Verifica se a API está funcionando.

**Permissões:** Pública (sem autenticação)  
**Rate Limit:** Public

### Response 200 - Success
```typescript
{
  status: "ok";
  timestamp: Date;
  uptime: number;      // Tempo de atividade em segundos
  environment: string; // "development" | "production" | "test"
}
```

### Response 503 - Service Unavailable
```typescript
{
  status: "error";
  message: string;
}
```

---

## Exemplo de Uso

```typescript
// Verificar status da API
const health = await fetch('http://localhost:3333/health')
  .then(r => r.json());

console.log(health);
// {
//   status: "ok",
//   timestamp: "2025-11-12T10:30:00.000Z",
//   uptime: 3600,
//   environment: "development"
// }

// Uso em monitoramento
async function checkApiHealth() {
  try {
    const response = await fetch('http://localhost:3333/health');
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'ok') {
        console.log('✓ API está funcionando');
        return true;
      }
    }
    
    console.log('✗ API com problemas');
    return false;
  } catch (error) {
    console.error('✗ API inacessível', error);
    return false;
  }
}

// Verificar a cada 30 segundos
setInterval(checkApiHealth, 30000);
```

---

## Notas

- Esta rota é útil para monitoramento e health checks em ambientes de produção
- Pode ser usada por ferramentas de orquestração (Kubernetes, Docker Swarm) para verificar a saúde do container
- Não requer autenticação, facilitando o monitoramento externo
- O campo `uptime` indica há quanto tempo o servidor está rodando
