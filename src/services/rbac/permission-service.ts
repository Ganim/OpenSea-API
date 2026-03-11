import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PermissionAuditLogsRepository } from '@/repositories/rbac/permission-audit-logs-repository';
import type { PermissionGroupPermissionsRepository } from '@/repositories/rbac/permission-group-permissions-repository';
import type { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';
import type { UserPermissionGroupsRepository } from '@/repositories/rbac/user-permission-groups-repository';

// Lazy imports to avoid @env initialization in unit tests
type RedisLike = {
  get: (key: string) => Promise<string | null>;
  setex: (key: string, ttl: number, value: string) => Promise<string>;
  del: (...keys: string[]) => Promise<number>;
};
let _redis: RedisLike | null | undefined; // undefined = not attempted yet
let _cacheConfig: { permissions: number } | null = null;
let _cacheKeys: { permissions: (userId: string) => string } | null = null;

function getRedis(): RedisLike | null {
  if (_redis === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _redis = require('@/lib/redis').getRedisClient() as RedisLike;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const config = require('@/config/redis');
      _cacheConfig = config.cacheConfig;
      _cacheKeys = config.cacheKeys;
    } catch {
      _redis = null;
    }
  }
  return _redis ?? null;
}

function getRedisCacheKey(userId: string): string {
  return _cacheKeys
    ? _cacheKeys.permissions(userId)
    : `permissions:user:${userId}`;
}

function getRedisTtl(): number {
  return _cacheConfig ? _cacheConfig.permissions : 300;
}

interface CheckPermissionParams {
  userId: UniqueEntityID;
  permissionCode: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
}

interface CheckPermissionResult {
  allowed: boolean;
  reason: string;
}

interface UserPermissionCache {
  permissions: Map<
    string,
    { effect: 'allow' | 'deny'; groupId: UniqueEntityID }[]
  >;
  cachedAt: Date;
  ttl: number; // em milissegundos
}

/**
 * PermissionService
 *
 * Serviço principal do sistema RBAC que:
 * - Verifica permissões com wildcard matching
 * - Aplica precedência de deny sobre allow
 * - Suporta herança de grupos (parent groups)
 * - Faz cache das permissões do usuário
 * - Registra auditoria de todas as verificações
 */
export class PermissionService {
  private cache = new Map<string, UserPermissionCache>();
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(
    private readonly permissionsRepository: PermissionsRepository,
    private readonly permissionGroupsRepository: PermissionGroupsRepository,
    private readonly permissionGroupPermissionsRepository: PermissionGroupPermissionsRepository,
    private readonly userPermissionGroupsRepository: UserPermissionGroupsRepository,
    private readonly permissionAuditLogsRepository: PermissionAuditLogsRepository,
  ) {}

  /**
   * Verifica se um usuário tem permissão para executar uma ação
   *
   * @param params - Parâmetros de verificação incluindo userId e permissionCode
   * @returns Resultado da verificação com allowed e reason
   */
  async checkPermission(
    params: CheckPermissionParams,
  ): Promise<CheckPermissionResult> {
    const {
      userId,
      permissionCode,
      resource,
      resourceId,
      action,
      ip,
      userAgent,
      endpoint,
    } = params;

    try {
      // 1. Buscar permissões do usuário (cache ou banco)
      const userPermissions = await this.getUserPermissions(userId);

      // 2. Verificar permissões com wildcard matching
      // Nota: Não é necessário que a permissão exata exista no sistema
      // se existe uma permissão wildcard que a cobre
      const matchingPermissions = this.findMatchingPermissions(
        permissionCode,
        userPermissions,
      );

      if (matchingPermissions.length === 0) {
        await this.logAuditTrail({
          userId,
          permissionCode,
          allowed: false,
          reason: 'No matching permissions found',
          resource,
          resourceId,
          action,
          ip,
          userAgent,
          endpoint,
        });

        return {
          allowed: false,
          reason: 'No matching permissions found',
        };
      }

      // 4. Aplicar precedência: deny > allow
      const hasDeny = matchingPermissions.some((p) => p.effect === 'deny');

      if (hasDeny) {
        await this.logAuditTrail({
          userId,
          permissionCode,
          allowed: false,
          reason: 'Denied by explicit deny rule',
          resource,
          resourceId,
          action,
          ip,
          userAgent,
          endpoint,
        });

        return {
          allowed: false,
          reason: 'Denied by explicit deny rule',
        };
      }

      // 5. Se chegou aqui, tem allow e não tem deny
      await this.logAuditTrail({
        userId,
        permissionCode,
        allowed: true,
        reason: 'Allowed by permission rules',
        resource,
        resourceId,
        action,
        ip,
        userAgent,
        endpoint,
      });

      return {
        allowed: true,
        reason: 'Allowed by permission rules',
      };
    } catch (error) {
      await this.logAuditTrail({
        userId,
        permissionCode,
        allowed: false,
        reason: `Error checking permission: ${error instanceof Error ? error.message : 'Unknown error'}`,
        resource,
        resourceId,
        action,
        ip,
        userAgent,
        endpoint,
      });

      return {
        allowed: false,
        reason: 'Error checking permission',
      };
    }
  }

  /**
   * Verifica se o usuário tem permissão (retorna apenas boolean)
   */
  async hasPermission(
    userId: UniqueEntityID,
    permissionCode: string,
  ): Promise<boolean> {
    const result = await this.checkPermission({ userId, permissionCode });
    return result.allowed;
  }

  /**
   * Obtém todos os códigos de permissão de um usuário
   * Retorna apenas as permissões com effect 'allow'
   */
  async getUserPermissionCodes(userId: UniqueEntityID): Promise<string[]> {
    const permissions = await this.getUserPermissions(userId);
    const codes: string[] = [];

    for (const [code, effects] of permissions.entries()) {
      // Aplicar precedência: se tem deny, não incluir
      const hasDeny = effects.some((p) => p.effect === 'deny');
      const hasAllow = effects.some((p) => p.effect === 'allow');

      if (hasAllow && !hasDeny) {
        codes.push(code);
      }
    }

    return codes;
  }

  /**
   * Obtém todas as permissões de um usuário (com cache L1 in-memory + L2 Redis)
   * Inclui herança de grupos
   */
  private async getUserPermissions(
    userId: UniqueEntityID,
  ): Promise<
    Map<string, { effect: 'allow' | 'deny'; groupId: UniqueEntityID }[]>
  > {
    const userIdStr = userId.toString();

    // L1: In-memory cache (same-process, sub-millisecond)
    const cached = this.cache.get(userIdStr);
    if (cached) {
      const cacheAge = Date.now() - cached.cachedAt.getTime();
      if (cacheAge < cached.ttl) {
        return cached.permissions;
      }
    }

    // L2: Redis cache (shared across requests, survives process restarts)
    const redisKey = getRedisCacheKey(userIdStr);
    try {
      const redis = getRedis();
      if (redis) {
        const redisData = await redis.get(redisKey);
        if (redisData) {
          const permissions = this.deserializePermissions(redisData);
          // Populate L1 from L2
          this.cache.set(userIdStr, {
            permissions,
            cachedAt: new Date(),
            ttl: this.DEFAULT_CACHE_TTL,
          });
          return permissions;
        }
      }
    } catch {
      // Redis unavailable — fall through to DB
    }

    // L3: Database
    const permissions = await this.fetchUserPermissionsFromDatabase(userId);

    // Write-back to L1
    this.cache.set(userIdStr, {
      permissions,
      cachedAt: new Date(),
      ttl: this.DEFAULT_CACHE_TTL,
    });

    // Write-back to L2 (non-blocking)
    try {
      const redis = getRedis();
      if (redis) {
        await redis.setex(
          redisKey,
          getRedisTtl(),
          this.serializePermissions(permissions),
        );
      }
    } catch {
      // Redis unavailable — L1 still works
    }

    return permissions;
  }

  /**
   * Busca permissões do usuário no banco de dados
   * Inclui herança de grupos pais
   */
  private async fetchUserPermissionsFromDatabase(
    userId: UniqueEntityID,
  ): Promise<
    Map<string, { effect: 'allow' | 'deny'; groupId: UniqueEntityID }[]>
  > {
    // 1. Obter grupos ativos do usuário
    const userGroups =
      await this.userPermissionGroupsRepository.listActiveByUserId(userId);

    if (userGroups.length === 0) {
      return new Map();
    }

    // 2. Obter IDs dos grupos incluindo ancestrais
    const allGroupIds = new Set<UniqueEntityID>();

    for (const userGroup of userGroups) {
      allGroupIds.add(userGroup.groupId);

      // Adicionar grupos ancestrais
      const ancestors = await this.permissionGroupsRepository.findAncestors(
        userGroup.groupId,
      );
      ancestors.forEach((ancestor) => allGroupIds.add(ancestor.id));
    }

    // 3. Buscar permissões de todos os grupos
    const permissionsMap = new Map<
      string,
      { effect: 'allow' | 'deny'; groupId: UniqueEntityID }[]
    >();

    for (const groupId of allGroupIds) {
      const groupPermissions =
        await this.permissionGroupPermissionsRepository.listPermissionsWithEffect(
          groupId,
        );

      for (const gp of groupPermissions) {
        const code = gp.permission.code.value;
        const effect = gp.effect.isAllow ? 'allow' : 'deny';

        if (!permissionsMap.has(code)) {
          permissionsMap.set(code, []);
        }

        permissionsMap.get(code)!.push({
          effect,
          groupId,
        });
      }
    }

    return permissionsMap;
  }

  /**
   * Encontra permissões que fazem match com wildcard
   *
   * Exemplos:
   * - "stock.products.create" match com "stock.products.create"
   * - "stock.products.create" match com "stock.*.create"
   * - "stock.products.create" match com "*.products.*"
   * - "stock.products.create" match com "*.*.*"
   */
  private findMatchingPermissions(
    requestedPermission: string,
    userPermissions: Map<
      string,
      { effect: 'allow' | 'deny'; groupId: UniqueEntityID }[]
    >,
  ): { effect: 'allow' | 'deny'; groupId: UniqueEntityID }[] {
    const matching: { effect: 'allow' | 'deny'; groupId: UniqueEntityID }[] =
      [];

    for (const [permCode, permissions] of userPermissions.entries()) {
      if (this.matchesWildcard(requestedPermission, permCode)) {
        matching.push(...permissions);
      }
    }

    return matching;
  }

  /**
   * Verifica se uma permissão match com um padrão wildcard
   */
  private matchesWildcard(requested: string, pattern: string): boolean {
    // Exato match
    if (requested === pattern) {
      return true;
    }

    // Se não tem wildcard, não match
    if (!pattern.includes('*')) {
      return false;
    }

    // Dividir por pontos
    const requestedParts = requested.split('.');
    const patternParts = pattern.split('.');

    // Devem ter mesmo número de partes
    if (requestedParts.length !== patternParts.length) {
      return false;
    }

    // Verificar cada parte
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] !== '*' && patternParts[i] !== requestedParts[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Invalida o cache de permissões de um usuário (L1 + L2)
   */
  invalidateUserCache(userId: UniqueEntityID): void {
    const userIdStr = userId.toString();
    this.cache.delete(userIdStr);
    try {
      const redis = getRedis();
      if (redis) {
        redis.del(getRedisCacheKey(userIdStr));
      }
    } catch {
      // Redis unavailable — L1 already cleared
    }
  }

  /**
   * Limpa todo o cache de permissões (L1 only — Redis keys expire via TTL)
   */
  clearCache(): void {
    this.cache.clear();
  }

  private serializePermissions(
    permissions: Map<
      string,
      { effect: 'allow' | 'deny'; groupId: UniqueEntityID }[]
    >,
  ): string {
    const obj: Record<string, { effect: 'allow' | 'deny'; groupId: string }[]> =
      {};
    for (const [code, entries] of permissions.entries()) {
      obj[code] = entries.map((e) => ({
        effect: e.effect,
        groupId: e.groupId.toString(),
      }));
    }
    return JSON.stringify(obj);
  }

  private deserializePermissions(
    data: string,
  ): Map<string, { effect: 'allow' | 'deny'; groupId: UniqueEntityID }[]> {
    const obj = JSON.parse(data) as Record<
      string,
      { effect: 'allow' | 'deny'; groupId: string }[]
    >;
    const map = new Map<
      string,
      { effect: 'allow' | 'deny'; groupId: UniqueEntityID }[]
    >();
    for (const [code, entries] of Object.entries(obj)) {
      map.set(
        code,
        entries.map((e) => ({
          effect: e.effect,
          groupId: new UniqueEntityID(e.groupId),
        })),
      );
    }
    return map;
  }

  /**
   * Registra auditoria da verificação de permissão
   */
  private async logAuditTrail(data: {
    userId: UniqueEntityID;
    permissionCode: string;
    allowed: boolean;
    reason: string;
    resource?: string;
    resourceId?: string;
    action?: string;
    ip?: string;
    userAgent?: string;
    endpoint?: string;
  }): Promise<void> {
    try {
      await this.permissionAuditLogsRepository.log({
        userId: data.userId,
        permissionCode: data.permissionCode,
        allowed: data.allowed,
        reason: data.reason,
        resource: data.resource ?? null,
        resourceId: data.resourceId ?? null,
        action: data.action ?? null,
        ip: data.ip ?? null,
        userAgent: data.userAgent ?? null,
        endpoint: data.endpoint ?? null,
      });
    } catch (error) {
      // Não falhar a verificação por causa de erro no log
      console.error('Failed to log permission audit:', error);
    }
  }
}
