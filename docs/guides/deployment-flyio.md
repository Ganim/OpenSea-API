# Deploy no Fly.io - OpenSea

## Pré-requisitos

1. **Instalar Fly CLI**:
   ```bash
   # Windows (PowerShell)
   pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"

   # Ou via npm
   npm install -g flyctl
   ```

2. **Criar conta e fazer login**:
   ```bash
   fly auth signup   # criar conta (ou acessar https://fly.io)
   fly auth login    # autenticar
   ```

---

## 1. Deploy da API (OpenSea-API)

### 1.1 Criar o app no Fly.io

```bash
cd OpenSea-API

# Criar o app (ele vai detectar o fly.toml)
fly apps create opensea-api --org personal
```

### 1.2 Configurar Secrets (variáveis de ambiente)

```bash
# Database (mantenha no Neon/Supabase ou use o Fly Postgres)
fly secrets set DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" -a opensea-api

# Redis (mantenha no Upstash ou use o Fly Redis)
fly secrets set REDIS_HOST="your-redis-host.upstash.io" -a opensea-api
fly secrets set REDIS_PORT="6379" -a opensea-api
fly secrets set REDIS_PASSWORD="your-password" -a opensea-api
fly secrets set REDIS_TLS="true" -a opensea-api

# JWT
fly secrets set JWT_SECRET="sua-chave-secreta-forte-32-chars" -a opensea-api

# CORS (URL do frontend - atualizar após deploy do frontend)
fly secrets set FRONTEND_URL="https://opensea-app.fly.dev" -a opensea-api

# Email (Resend)
fly secrets set SMTP_HOST="smtp.resend.com" -a opensea-api
fly secrets set SMTP_PORT="465" -a opensea-api
fly secrets set SMTP_USER="resend" -a opensea-api
fly secrets set SMTP_PASS="re_sua_api_key" -a opensea-api

# Sentry (opcional)
fly secrets set SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx" -a opensea-api
```

### 1.3 Deploy

```bash
fly deploy -a opensea-api
```

### 1.4 Verificar

```bash
# Ver logs
fly logs -a opensea-api

# Abrir no browser
fly open -a opensea-api

# Status
fly status -a opensea-api
```

A API estará disponível em: `https://opensea-api.fly.dev`

---

## 2. Deploy do Frontend (OpenSea-APP)

### 2.1 Criar o app

```bash
cd OpenSea-APP

fly apps create opensea-app --org personal
```

### 2.2 Atualizar a URL da API no fly.toml

Edite `OpenSea-APP/fly.toml` se necessário:

```toml
[build.args]
  NEXT_PUBLIC_API_URL = 'https://opensea-api.fly.dev'
```

### 2.3 Deploy

```bash
fly deploy -a opensea-app
```

### 2.4 Verificar

```bash
fly logs -a opensea-app
fly open -a opensea-app
```

O frontend estará disponível em: `https://opensea-app.fly.dev`

---

## 3. Domínio Customizado (Opcional)

```bash
# Adicionar domínio customizado
fly certs add seu-dominio.com.br -a opensea-api
fly certs add app.seu-dominio.com.br -a opensea-app

# Ver instruções de DNS
fly certs show seu-dominio.com.br -a opensea-api
```

---

## 4. Escalar (Opcional)

```bash
# Aumentar memória (256mb, 512mb, 1gb, 2gb...)
fly scale memory 1024 -a opensea-api

# Aumentar CPU
fly scale vm shared-cpu-2x -a opensea-api

# Múltiplas instâncias (alta disponibilidade)
fly scale count 2 -a opensea-api
```

---

## 5. Comandos Úteis

```bash
# Ver logs em tempo real
fly logs -a opensea-api

# SSH no container
fly ssh console -a opensea-api

# Rodar comando único (ex: migrations)
fly ssh console -a opensea-api -C "npx prisma migrate deploy"

# Reiniciar
fly apps restart opensea-api

# Ver métricas
fly dashboard -a opensea-api

# Ver secrets configurados
fly secrets list -a opensea-api
```

---

## 6. Custos Estimados

O Fly.io cobra por uso. Com a configuração atual (shared-cpu-1x, 512MB RAM):

| Recurso | Custo Estimado |
|---------|----------------|
| API (1 VM, 24/7) | ~$5-7/mês |
| Frontend (1 VM, 24/7) | ~$5-7/mês |
| **Total** | **~$10-14/mês** |

> **Nota**: O Fly.io oferece $5 de crédito grátis por mês, então pode sair ainda mais barato.

---

## 7. Comparação com Render Free

| Aspecto | Render Free | Fly.io (pago) |
|---------|-------------|---------------|
| Cold Start | 30-60s após 15min | Nenhum (sempre ativo) |
| RAM | 512MB | 512MB+ (configurável) |
| Região Brasil | Não | Sim (São Paulo) |
| Custo | Grátis | ~$10-14/mês |

---

## Troubleshooting

### Build falhou

```bash
# Ver logs do build
fly logs -a opensea-api --build

# Rebuild forçando sem cache
fly deploy -a opensea-api --no-cache
```

### Migrations não rodaram

```bash
# Rodar manualmente
fly ssh console -a opensea-api -C "npx prisma migrate deploy"
```

### App não inicia

```bash
# Verificar variáveis de ambiente
fly secrets list -a opensea-api

# Ver logs detalhados
fly logs -a opensea-api --region gru
```
