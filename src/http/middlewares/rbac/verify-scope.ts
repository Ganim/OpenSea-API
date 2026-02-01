import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPermissionAuditLogsRepository } from '@/repositories/rbac/prisma/prisma-permission-audit-logs-repository';
import { PrismaPermissionGroupPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permission-group-permissions-repository';
import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { PrismaUserPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-user-permission-groups-repository';
import { PermissionService } from '@/services/rbac/permission-service';
import type { FastifyRequest } from 'fastify';

/**
 * Opções para verificação de permissão com escopo
 */
export interface ScopePermissionCheckOptions {
  /**
   * Código base da permissão (sem sufixo .all ou .team)
   * Exemplo: 'hr.employees.read' -> verificará 'hr.employees.read.all' e 'hr.employees.read.team'
   */
  basePermissionCode: string;

  /**
   * Nome do recurso (para auditoria)
   */
  resource?: string;

  /**
   * Função para extrair o departmentId do recurso sendo acessado
   * Usada quando o usuário tem permissão .team para verificar se o recurso pertence ao seu departamento
   *
   * @param request - A requisição Fastify
   * @returns O ID do departamento do recurso, ou null se não aplicável
   */
  getResourceDepartmentId?: (request: FastifyRequest) => Promise<string | null>;
}

/**
 * Resultado da verificação de escopo
 */
export interface ScopeCheckResult {
  /**
   * Se o usuário tem acesso
   */
  allowed: boolean;

  /**
   * Tipo de escopo concedido
   */
  scope: 'all' | 'team' | 'none';

  /**
   * ID do departamento do usuário (se aplicável)
   */
  userDepartmentId?: string;
}

/**
 * Factory para criar middleware de verificação de permissão com escopo
 *
 * Este middleware verifica se o usuário tem permissão .all ou .team para um recurso.
 * Se tiver apenas .team, verifica se o recurso pertence ao seu departamento.
 *
 * A hierarquia é: .all implica .team (quem tem .all pode acessar qualquer recurso)
 *
 * @param options - Opções de verificação de escopo
 * @returns Middleware do Fastify
 *
 * @example
 * ```typescript
 * import { createScopeMiddleware } from '@/middlewares/rbac/verify-scope';
 *
 * const checkEmployeeRead = createScopeMiddleware({
 *   basePermissionCode: 'hr.employees.read',
 *   resource: 'employees',
 *   getResourceDepartmentId: async (request) => {
 *     const employeeId = request.params.id;
 *     const employee = await employeesRepository.findById(employeeId);
 *     return employee?.departmentId?.toString() ?? null;
 *   }
 * });
 *
 * app.route({
 *   method: 'GET',
 *   url: '/employees/:id',
 *   preHandler: [verifyJwt, checkEmployeeRead],
 *   handler: async (request, reply) => { ... }
 * });
 * ```
 */
export function createScopeMiddleware(options: ScopePermissionCheckOptions) {
  return async function verifyScopePermission(request: FastifyRequest) {
    const user = request.user as { sub?: string } | undefined;

    if (!user || !user.sub) {
      throw new UnauthorizedError('User not authenticated');
    }

    const permissionService = createPermissionServiceInstance();
    const userId = new UniqueEntityID(user.sub);

    // Primeiro, verifica permissão .all
    const allPermissionCode = `${options.basePermissionCode}.all`;
    const allResult = await permissionService.checkPermission({
      userId,
      permissionCode: allPermissionCode,
      resource: options.resource,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      endpoint: request.url,
    });

    if (allResult.allowed) {
      // Usuário tem permissão .all, permite acesso irrestrito
      request.scopeCheck = {
        allowed: true,
        scope: 'all',
      } as ScopeCheckResult;
      return;
    }

    // Verifica permissão .team
    const teamPermissionCode = `${options.basePermissionCode}.team`;
    const teamResult = await permissionService.checkPermission({
      userId,
      permissionCode: teamPermissionCode,
      resource: options.resource,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      endpoint: request.url,
    });

    if (!teamResult.allowed) {
      // Não tem nem .all nem .team
      throw new ForbiddenError(
        `Permission denied: requires ${allPermissionCode} or ${teamPermissionCode}`,
      );
    }

    // Tem permissão .team - precisa verificar se o recurso pertence ao departamento do usuário
    const employeesRepository = new PrismaEmployeesRepository();
    const userEmployee = await employeesRepository.findByUserId(userId);

    if (!userEmployee || !userEmployee.departmentId) {
      throw new ForbiddenError(
        'You need to be associated with a department to access team resources',
      );
    }

    const userDepartmentId = userEmployee.departmentId.toString();

    // Se há uma função para obter o departmentId do recurso, usamos ela
    if (options.getResourceDepartmentId) {
      const resourceDepartmentId =
        await options.getResourceDepartmentId(request);

      if (resourceDepartmentId && resourceDepartmentId !== userDepartmentId) {
        throw new ForbiddenError(
          'This resource does not belong to your department',
        );
      }
    }

    // Salva resultado da verificação para uso posterior
    request.scopeCheck = {
      allowed: true,
      scope: 'team',
      userDepartmentId,
    } as ScopeCheckResult;
  };
}

/**
 * Factory para criar middleware que apenas identifica o escopo do usuário
 * sem verificar um recurso específico.
 *
 * Útil para listagens onde o escopo define o filtro aplicado.
 *
 * @param basePermissionCode - Código base da permissão
 * @returns Middleware do Fastify
 *
 * @example
 * ```typescript
 * const identifyEmployeeListScope = createScopeIdentifierMiddleware('hr.employees.list');
 *
 * app.route({
 *   method: 'GET',
 *   url: '/employees',
 *   preHandler: [verifyJwt, identifyEmployeeListScope],
 *   handler: async (request, reply) => {
 *     const scopeCheck = request.scopeCheck;
 *     if (scopeCheck.scope === 'all') {
 *       // Lista todos os funcionários
 *     } else if (scopeCheck.scope === 'team') {
 *       // Lista apenas funcionários do departamento do usuário
 *       const employees = await repo.findByDepartment(scopeCheck.userDepartmentId);
 *     }
 *   }
 * });
 * ```
 */
export function createScopeIdentifierMiddleware(basePermissionCode: string) {
  return async function identifyScope(request: FastifyRequest) {
    const user = request.user as { sub?: string } | undefined;

    if (!user || !user.sub) {
      throw new UnauthorizedError('User not authenticated');
    }

    const permissionService = createPermissionServiceInstance();
    const userId = new UniqueEntityID(user.sub);

    // Verifica permissão .all
    const allPermissionCode = `${basePermissionCode}.all`;
    const allResult = await permissionService.checkPermission({
      userId,
      permissionCode: allPermissionCode,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      endpoint: request.url,
    });

    if (allResult.allowed) {
      request.scopeCheck = {
        allowed: true,
        scope: 'all',
      } as ScopeCheckResult;
      return;
    }

    // Verifica permissão .team
    const teamPermissionCode = `${basePermissionCode}.team`;
    const teamResult = await permissionService.checkPermission({
      userId,
      permissionCode: teamPermissionCode,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      endpoint: request.url,
    });

    if (!teamResult.allowed) {
      throw new ForbiddenError(
        `Permission denied: requires ${allPermissionCode} or ${teamPermissionCode}`,
      );
    }

    // Obtém departmentId do usuário
    const employeesRepository = new PrismaEmployeesRepository();
    const userEmployee = await employeesRepository.findByUserId(userId);

    if (!userEmployee || !userEmployee.departmentId) {
      throw new ForbiddenError(
        'You need to be associated with a department to access team resources',
      );
    }

    request.scopeCheck = {
      allowed: true,
      scope: 'team',
      userDepartmentId: userEmployee.departmentId.toString(),
    } as ScopeCheckResult;
  };
}

/**
 * Helper para criar instância do PermissionService
 * @private
 */
function createPermissionServiceInstance(): PermissionService {
  const permissionsRepository = new PrismaPermissionsRepository();
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
  const permissionGroupPermissionsRepository =
    new PrismaPermissionGroupPermissionsRepository();
  const userPermissionGroupsRepository =
    new PrismaUserPermissionGroupsRepository();
  const permissionAuditLogsRepository =
    new PrismaPermissionAuditLogsRepository();

  return new PermissionService(
    permissionsRepository,
    permissionGroupsRepository,
    permissionGroupPermissionsRepository,
    userPermissionGroupsRepository,
    permissionAuditLogsRepository,
  );
}

// Extende a interface FastifyRequest para incluir scopeCheck
declare module 'fastify' {
  interface FastifyRequest {
    scopeCheck?: ScopeCheckResult;
  }
}
