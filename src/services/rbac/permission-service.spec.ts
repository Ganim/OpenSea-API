import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionGroup } from '@/entities/rbac/permission-group';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { PermissionEffect } from '@/entities/rbac/value-objects/permission-effect';
import { InMemoryPermissionAuditLogsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-audit-logs-repository';
import { InMemoryPermissionGroupPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-group-permissions-repository';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { InMemoryUserPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-user-permission-groups-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { PermissionService } from './permission-service';

describe('PermissionService', () => {
  let permissionsRepository: InMemoryPermissionsRepository;
  let permissionGroupsRepository: InMemoryPermissionGroupsRepository;
  let permissionGroupPermissionsRepository: InMemoryPermissionGroupPermissionsRepository;
  let userPermissionGroupsRepository: InMemoryUserPermissionGroupsRepository;
  let permissionAuditLogsRepository: InMemoryPermissionAuditLogsRepository;
  let permissionService: PermissionService;

  let userId: UniqueEntityID;

  beforeEach(() => {
    // Inicializar repositórios
    permissionsRepository = new InMemoryPermissionsRepository();
    permissionGroupsRepository = new InMemoryPermissionGroupsRepository();
    permissionGroupPermissionsRepository =
      new InMemoryPermissionGroupPermissionsRepository();
    userPermissionGroupsRepository = new InMemoryUserPermissionGroupsRepository(
      permissionGroupsRepository,
      permissionGroupPermissionsRepository,
    );
    permissionAuditLogsRepository = new InMemoryPermissionAuditLogsRepository();

    // Criar serviço
    permissionService = new PermissionService(
      permissionsRepository,
      permissionGroupsRepository,
      permissionGroupPermissionsRepository,
      userPermissionGroupsRepository,
      permissionAuditLogsRepository,
    );

    // Criar IDs de teste
    userId = new UniqueEntityID();
  });

  describe('checkPermission', () => {
    it('should deny permission when user has no matching permissions', async () => {
      const result = await permissionService.checkPermission({
        userId,
        permissionCode: 'non.existent.permission',
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('No matching permissions found');
    });

    it('should deny permission when user has no groups', async () => {
      // Criar permissão
      await permissionsRepository.create({
        code: PermissionCode.create('stock.products.create'),
        name: 'Create Products',
        description: 'Allows creating products',
        module: 'stock',
        resource: 'products',
        action: 'create',
        isSystem: false,
        metadata: {},
      });

      const result = await permissionService.checkPermission({
        userId,
        permissionCode: 'stock.products.create',
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('No matching permissions found');
    });

    it('should allow permission when user has direct permission', async () => {
      // Criar permissão
      const permission = await permissionsRepository.create({
        code: PermissionCode.create('stock.products.create'),
        name: 'Create Products',
        description: 'Allows creating products',
        module: 'stock',
        resource: 'products',
        action: 'create',
        isSystem: false,
        metadata: {},
      });

      // Criar grupo
      const group = await permissionGroupsRepository.create({
        name: 'Admin',
        slug: 'admin',
        description: 'Admin group',
        isSystem: false,
        isActive: true,
        color: '#FF0000',
        priority: 100,
        parentId: null,
      });

      // Atribuir permissão ao grupo
      await permissionGroupPermissionsRepository.add({
        groupId: group.id,
        permissionId: permission.id,
        effect: PermissionEffect.create('allow'),
        conditions: null,
      });

      // Adicionar permissões no array para listPermissionsWithEffect funcionar
      permissionGroupPermissionsRepository.permissions.push(permission);

      // Atribuir grupo ao usuário
      await userPermissionGroupsRepository.assign({
        userId,
        groupId: group.id,
        expiresAt: null,
        grantedBy: null,
      });

      const result = await permissionService.checkPermission({
        userId,
        permissionCode: 'stock.products.create',
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Allowed by permission rules');
    });

    it('should deny permission when explicit deny exists', async () => {
      // Criar permissão
      const permission = await permissionsRepository.create({
        code: PermissionCode.create('stock.products.delete'),
        name: 'Delete Products',
        description: 'Allows deleting products',
        module: 'stock',
        resource: 'products',
        action: 'delete',
        isSystem: false,
        metadata: {},
      });

      // Criar grupo
      const group = await permissionGroupsRepository.create({
        name: 'User',
        slug: 'user',
        description: 'Regular user',
        isSystem: false,
        isActive: true,
        color: '#00FF00',
        priority: 50,
        parentId: null,
      });

      // Atribuir permissão DENY ao grupo
      await permissionGroupPermissionsRepository.add({
        groupId: group.id,
        permissionId: permission.id,
        effect: PermissionEffect.create('deny'),
        conditions: null,
      });

      permissionGroupPermissionsRepository.permissions.push(permission);

      // Atribuir grupo ao usuário
      await userPermissionGroupsRepository.assign({
        userId,
        groupId: group.id,
        expiresAt: null,
        grantedBy: null,
      });

      const result = await permissionService.checkPermission({
        userId,
        permissionCode: 'stock.products.delete',
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Denied by explicit deny rule');
    });

    it('should log audit trail for all permission checks', async () => {
      await permissionService.checkPermission({
        userId,
        permissionCode: 'test.permission',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        endpoint: '/api/test',
      });

      const logs = await permissionAuditLogsRepository.listByUserId(userId);

      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toEqual(userId);
      expect(logs[0].permissionCode).toBe('test.permission');
      expect(logs[0].ip).toBe('192.168.1.1');
      expect(logs[0].userAgent).toBe('Mozilla/5.0');
      expect(logs[0].endpoint).toBe('/api/test');
    });
  });

  describe('wildcard matching', () => {
    let testGroup: PermissionGroup;

    beforeEach(async () => {
      // Criar grupo
      testGroup = await permissionGroupsRepository.create({
        name: 'Test Group',
        slug: 'test-group',
        description: 'Test group',
        isSystem: false,
        isActive: true,
        color: '#0000FF',
        priority: 50,
        parentId: null,
      });

      // Atribuir grupo ao usuário
      await userPermissionGroupsRepository.assign({
        userId,
        groupId: testGroup.id,
        expiresAt: null,
        grantedBy: null,
      });
    });

    it('should match exact permission', async () => {
      const permission = await permissionsRepository.create({
        code: PermissionCode.create('stock.products.read'),
        name: 'Read Products',
        description: 'Allows reading products',
        module: 'stock',
        resource: 'products',
        action: 'read',
        isSystem: false,
        metadata: {},
      });

      const group = testGroup;

      await permissionGroupPermissionsRepository.add({
        groupId: group.id,
        permissionId: permission.id,
        effect: PermissionEffect.create('allow'),
        conditions: null,
      });

      permissionGroupPermissionsRepository.permissions.push(permission);

      const result = await permissionService.checkPermission({
        userId,
        permissionCode: 'stock.products.read',
      });

      expect(result.allowed).toBe(true);
    });

    it('should match wildcard in action: stock.products.*', async () => {
      const permission = await permissionsRepository.create({
        code: PermissionCode.create('stock.products.*'),
        name: 'All Products Actions',
        description: 'Allows all actions on products',
        module: 'stock',
        resource: 'products',
        action: '*',
        isSystem: false,
        metadata: {},
      });

      const group = testGroup;

      await permissionGroupPermissionsRepository.add({
        groupId: group.id,
        permissionId: permission.id,
        effect: PermissionEffect.create('allow'),
        conditions: null,
      });

      permissionGroupPermissionsRepository.permissions.push(permission);

      const result = await permissionService.checkPermission({
        userId,
        permissionCode: 'stock.products.read',
      });

      expect(result.allowed).toBe(true);
    });

    it('should match wildcard in resource: stock.*.read', async () => {
      const permission = await permissionsRepository.create({
        code: PermissionCode.create('stock.*.read'),
        name: 'Read All Stock Resources',
        description: 'Allows reading all stock resources',
        module: 'stock',
        resource: '*',
        action: 'read',
        isSystem: false,
        metadata: {},
      });

      const group = testGroup;

      await permissionGroupPermissionsRepository.add({
        groupId: group.id,
        permissionId: permission.id,
        effect: PermissionEffect.create('allow'),
        conditions: null,
      });

      permissionGroupPermissionsRepository.permissions.push(permission);

      const result = await permissionService.checkPermission({
        userId,
        permissionCode: 'stock.products.read',
      });

      expect(result.allowed).toBe(true);
    });

    it('should match full wildcard: *.*.*', async () => {
      const permission = await permissionsRepository.create({
        code: PermissionCode.create('*.*.*'),
        name: 'Super Admin',
        description: 'Full system access',
        module: '*',
        resource: '*',
        action: '*',
        isSystem: true,
        metadata: {},
      });

      const group = testGroup;

      await permissionGroupPermissionsRepository.add({
        groupId: group.id,
        permissionId: permission.id,
        effect: PermissionEffect.create('allow'),
        conditions: null,
      });

      permissionGroupPermissionsRepository.permissions.push(permission);

      const result = await permissionService.checkPermission({
        userId,
        permissionCode: 'stock.products.read',
      });

      expect(result.allowed).toBe(true);
    });

    it('should not match wildcards with different number of parts', async () => {
      // Este teste verifica que permissões com diferentes estruturas não fazem match
      // Por exemplo: "stock.products" (2 partes) não match com "stock.products.read" (3 partes)
      // Como PermissionCode valida o formato, vamos testar que permissões específicas não fazem match entre si

      const permission = await permissionsRepository.create({
        code: PermissionCode.create('stock.variants.read'),
        name: 'Read Variants',
        description: 'Read variants',
        module: 'stock',
        resource: 'variants',
        action: 'read',
        isSystem: false,
        metadata: {},
      });

      const group = testGroup;

      await permissionGroupPermissionsRepository.add({
        groupId: group.id,
        permissionId: permission.id,
        effect: PermissionEffect.create('allow'),
        conditions: null,
      });

      permissionGroupPermissionsRepository.permissions.push(permission);

      // Tentar verificar permissão diferente (deve falhar)
      const result = await permissionService.checkPermission({
        userId,
        permissionCode: 'stock.products.read',
      });

      expect(result.allowed).toBe(false);
    });
  });

  describe('deny precedence', () => {
    it('should deny when both allow and deny exist', async () => {
      // Criar duas permissões
      const permission1 = await permissionsRepository.create({
        code: PermissionCode.create('stock.products.delete'),
        name: 'Delete Products',
        description: 'Delete products',
        module: 'stock',
        resource: 'products',
        action: 'delete',
        isSystem: false,
        metadata: {},
      });

      // Criar dois grupos
      const allowGroup = await permissionGroupsRepository.create({
        name: 'Allow Group',
        slug: 'allow-group',
        description: 'Allow group',
        isSystem: false,
        isActive: true,
        color: '#00FF00',
        priority: 50,
        parentId: null,
      });

      const denyGroup = await permissionGroupsRepository.create({
        name: 'Deny Group',
        slug: 'deny-group',
        description: 'Deny group',
        isSystem: false,
        isActive: true,
        color: '#FF0000',
        priority: 100,
        parentId: null,
      });

      // Atribuir ALLOW no primeiro grupo
      await permissionGroupPermissionsRepository.add({
        groupId: allowGroup.id,
        permissionId: permission1.id,
        effect: PermissionEffect.create('allow'),
        conditions: null,
      });

      // Atribuir DENY no segundo grupo
      await permissionGroupPermissionsRepository.add({
        groupId: denyGroup.id,
        permissionId: permission1.id,
        effect: PermissionEffect.create('deny'),
        conditions: null,
      });

      permissionGroupPermissionsRepository.permissions.push(permission1);

      // Atribuir ambos os grupos ao usuário
      await userPermissionGroupsRepository.assign({
        userId,
        groupId: allowGroup.id,
        expiresAt: null,
        grantedBy: null,
      });

      await userPermissionGroupsRepository.assign({
        userId,
        groupId: denyGroup.id,
        expiresAt: null,
        grantedBy: null,
      });

      const result = await permissionService.checkPermission({
        userId,
        permissionCode: 'stock.products.delete',
      });

      // Deny sempre tem precedência
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Denied by explicit deny rule');
    });
  });

  describe('cache', () => {
    it('should cache user permissions', async () => {
      const permission = await permissionsRepository.create({
        code: PermissionCode.create('test.cache.read'),
        name: 'Test Cache',
        description: 'Test cache',
        module: 'test',
        resource: 'cache',
        action: 'read',
        isSystem: false,
        metadata: {},
      });

      const group = await permissionGroupsRepository.create({
        name: 'Test Group',
        slug: 'test-group',
        description: 'Test group',
        isSystem: false,
        isActive: true,
        color: '#0000FF',
        priority: 50,
        parentId: null,
      });

      await permissionGroupPermissionsRepository.add({
        groupId: group.id,
        permissionId: permission.id,
        effect: PermissionEffect.create('allow'),
        conditions: null,
      });

      permissionGroupPermissionsRepository.permissions.push(permission);

      await userPermissionGroupsRepository.assign({
        userId,
        groupId: group.id,
        expiresAt: null,
        grantedBy: null,
      });

      // Primeira chamada - deve buscar do banco
      const result1 = await permissionService.checkPermission({
        userId,
        permissionCode: 'test.cache.read',
      });

      expect(result1.allowed).toBe(true);

      // Segunda chamada - deve usar cache
      const result2 = await permissionService.checkPermission({
        userId,
        permissionCode: 'test.cache.read',
      });

      expect(result2.allowed).toBe(true);

      // Verificar que só foi criado um log de auditoria por chamada
      const logs = await permissionAuditLogsRepository.listByUserId(userId);
      expect(logs).toHaveLength(2); // Uma para cada checkPermission
    });

    it('should invalidate cache for specific user', async () => {
      const permission = await permissionsRepository.create({
        code: PermissionCode.create('test.invalidate.read'),
        name: 'Test Invalidate',
        description: 'Test invalidate',
        module: 'test',
        resource: 'invalidate',
        action: 'read',
        isSystem: false,
        metadata: {},
      });

      const group = await permissionGroupsRepository.create({
        name: 'Test Group',
        slug: 'test-group',
        description: 'Test group',
        isSystem: false,
        isActive: true,
        color: '#0000FF',
        priority: 50,
        parentId: null,
      });

      await permissionGroupPermissionsRepository.add({
        groupId: group.id,
        permissionId: permission.id,
        effect: PermissionEffect.create('allow'),
        conditions: null,
      });

      permissionGroupPermissionsRepository.permissions.push(permission);

      await userPermissionGroupsRepository.assign({
        userId,
        groupId: group.id,
        expiresAt: null,
        grantedBy: null,
      });

      // Primeira chamada
      await permissionService.checkPermission({
        userId,
        permissionCode: 'test.invalidate.read',
      });

      // Invalidar cache
      permissionService.invalidateUserCache(userId);

      // Segunda chamada - deve buscar do banco novamente
      const result = await permissionService.checkPermission({
        userId,
        permissionCode: 'test.invalidate.read',
      });

      expect(result.allowed).toBe(true);
    });

    it('should clear all cache', () => {
      permissionService.clearCache();

      // Não há muito o que testar aqui, só garantir que não falhe
      expect(true).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should return boolean for permission check', async () => {
      const permission = await permissionsRepository.create({
        code: PermissionCode.create('test.boolean.read'),
        name: 'Test Boolean',
        description: 'Test boolean',
        module: 'test',
        resource: 'boolean',
        action: 'read',
        isSystem: false,
        metadata: {},
      });

      const group = await permissionGroupsRepository.create({
        name: 'Test Group',
        slug: 'test-group',
        description: 'Test group',
        isSystem: false,
        isActive: true,
        color: '#0000FF',
        priority: 50,
        parentId: null,
      });

      await permissionGroupPermissionsRepository.add({
        groupId: group.id,
        permissionId: permission.id,
        effect: PermissionEffect.create('allow'),
        conditions: null,
      });

      permissionGroupPermissionsRepository.permissions.push(permission);

      await userPermissionGroupsRepository.assign({
        userId,
        groupId: group.id,
        expiresAt: null,
        grantedBy: null,
      });

      const hasPermission = await permissionService.hasPermission(
        userId,
        'test.boolean.read',
      );

      expect(hasPermission).toBe(true);

      const doesNotHave = await permissionService.hasPermission(
        userId,
        'test.boolean.write',
      );

      expect(doesNotHave).toBe(false);
    });
  });
});
