# ADR-003: Sistema RBAC com Permissões Granulares

## Status

Aceito

## Contexto

O sistema precisa de controle de acesso flexível que permita:

1. Diferentes níveis de acesso por módulo
2. Permissões granulares (CRUD por recurso)
3. Escopo de recursos (todos vs equipe)
4. Grupos de permissões reutilizáveis
5. Permissões diretas para exceções

## Decisão

Implementar **RBAC (Role-Based Access Control)** com estrutura hierárquica:

### Estrutura de Permissões

```
{módulo}.{recurso}.{ação}[.{escopo}]
```

Exemplos:
- `stock.products.create` - Criar produtos
- `stock.products.read.all` - Ler todos os produtos
- `stock.products.read.team` - Ler produtos do departamento
- `hr.employees.manage` - Gerenciar funcionários

### Modelo de Dados

```prisma
model Permission {
  id          String   @id @default(uuid())
  code        String   @unique  // stock.products.create
  name        String
  description String?
  module      String   // stock, hr, sales, core
}

model PermissionGroup {
  id          String   @id @default(uuid())
  name        String   @unique  // Administrador, Gestor Estoque
  description String?
  permissions PermissionGroupPermission[]
  users       UserPermissionGroup[]
}

model UserDirectPermission {
  id           String    @id @default(uuid())
  userId       String
  permissionId String
  grantedBy    String
  grantedAt    DateTime  @default(now())
  expiresAt    DateTime?
}
```

### Hierarquia de Verificação

1. Permissões diretas do usuário (override)
2. Permissões dos grupos do usuário
3. Escopo de recurso (.all vs .team)

### Cache de Permissões

```typescript
// Redis key: permissions:user:{userId}
// TTL: 5 minutos
{
  permissions: ['stock.products.read.all', 'stock.products.create', ...],
  groups: ['admin', 'stock-manager'],
  departmentId: 'dept-123'
}
```

## Consequências

### Positivas

- **Flexibilidade**: 519 permissões granulares
- **Escopo**: Controle por departamento/equipe
- **Performance**: Cache Redis (< 1ms lookup)
- **Auditoria**: Log de concessão/revogação
- **Manutenibilidade**: Grupos reutilizáveis

### Negativas

- **Complexidade**: Mais tabelas e relacionamentos
- **Configuração**: Setup inicial de permissões
- **Cache**: Necessidade de invalidação correta

## Grupos Padrão

| Grupo | Permissões | Descrição |
|-------|------------|-----------|
| Administrador | 519 | Acesso total |
| Usuário | 16 | Acesso básico próprio |
| Gestor Estoque | ~80 | Módulo stock completo |
| Gestor RH | ~100 | Módulo HR completo |
| Gestor Vendas | ~60 | Módulo sales completo |

## Referências

- [NIST RBAC Model](https://csrc.nist.gov/projects/role-based-access-control)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
