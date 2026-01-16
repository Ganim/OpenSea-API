# ADR-002: Migração de JWT HS256 para RS256

## Status

Aceito

## Contexto

O sistema utiliza JWT para autenticação. Inicialmente implementado com HS256 (simétrico), que apresenta limitações:

1. **Segurança**: Mesma chave para assinar e verificar
2. **Distribuição**: Difícil compartilhar verificação sem expor assinatura
3. **Microserviços**: Cada serviço precisaria da chave secreta
4. **Rotação**: Trocar chave invalida todos os tokens

## Decisão

Implementar suporte a **RS256** (assimétrico) mantendo compatibilidade com HS256:

```typescript
// src/config/jwt.ts
export const jwtConfig = {
  algorithm: env.JWT_PRIVATE_KEY ? 'RS256' : 'HS256',
  accessTokenExpiresIn: '30m',
  refreshTokenExpiresIn: '7d',
  issuer: 'opensea-api',
  audience: 'opensea-client',
}
```

### Chaves RSA

```bash
# Gerar chaves RSA 4096-bit
openssl genrsa -out private.pem 4096
openssl rsa -in private.pem -pubout -out public.pem
```

### Variáveis de Ambiente

```env
# RS256 (produção)
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."

# HS256 (desenvolvimento - fallback)
JWT_SECRET=dev-secret-key
```

## Consequências

### Positivas

- **Segurança**: Chave privada nunca precisa sair do servidor de autenticação
- **Distribuição**: Chave pública pode ser compartilhada livremente
- **Microserviços**: Serviços verificam tokens com chave pública apenas
- **Rotação**: Pode-se publicar múltiplas chaves públicas (JWKS)

### Negativas

- **Performance**: RS256 ~10x mais lento que HS256 (ainda < 1ms)
- **Complexidade**: Gerenciamento de par de chaves
- **Tamanho**: Tokens RS256 são maiores (~30%)

## Migração

1. Sistema aceita ambos algoritmos durante transição
2. Novos tokens são emitidos com RS256 (se configurado)
3. Tokens HS256 antigos continuam válidos até expirar
4. Após período de migração, remover suporte HS256

## Referências

- [RFC 7518 - JSON Web Algorithms](https://tools.ietf.org/html/rfc7518)
- [Auth0 - RS256 vs HS256](https://auth0.com/blog/rs256-vs-hs256-whats-the-difference/)
