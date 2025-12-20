import { prisma } from '@/lib/prisma';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import type { Role as PrismaRole } from '@prisma/client';
import type { FastifyInstance } from 'fastify';

import request from 'supertest';

export async function createAndAuthenticateUser(
  app: FastifyInstance,
  role: PrismaRole = 'USER',
) {
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const fakeEmail = `test${uniqueId}@test.com`;
  const username = `user${uniqueId}`;

  const createUserUseCase = makeCreateUserUseCase();
  const userResponse = await createUserUseCase.execute({
    email: fakeEmail,
    password: 'Pass@123',
    username,
    role,
  });

  // Se for ADMIN, criar/atribuir permissões de audit
  if (role === 'ADMIN') {
    // Criar permissões de audit se não existirem
    const auditPermissions = [
      {
        code: 'audit.logs.view',
        name: 'Ver Logs de Auditoria',
        description: 'Permite visualizar logs de auditoria do sistema',
        module: 'audit',
        resource: 'logs',
        action: 'view',
      },
      {
        code: 'audit.history.view',
        name: 'Ver Histórico de Entidade',
        description: 'Permite visualizar histórico completo de uma entidade',
        module: 'audit',
        resource: 'history',
        action: 'view',
      },
      {
        code: 'audit.rollback.preview',
        name: 'Visualizar Preview de Rollback',
        description: 'Permite visualizar preview de rollback de alterações',
        module: 'audit',
        resource: 'rollback',
        action: 'preview',
      },
      {
        code: 'audit.compare.view',
        name: 'Comparar Versões',
        description: 'Permite comparar diferentes versões de uma entidade',
        module: 'audit',
        resource: 'compare',
        action: 'view',
      },
    ];

    for (const perm of auditPermissions) {
      await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: { ...perm, isSystem: true },
      });
    }

    // Buscar ou criar grupo admin
    let adminGroup = await prisma.permissionGroup.findFirst({
      where: { slug: 'admin', deletedAt: null },
    });

    if (!adminGroup) {
      adminGroup = await prisma.permissionGroup.create({
        data: {
          name: 'Administrador',
          slug: 'admin',
          description: 'Acesso completo ao sistema',
          isSystem: true,
          isActive: true,
          color: '#DC2626',
          priority: 100,
        },
      });
    }

    // Atribuir todas as permissões de audit ao grupo admin
    for (const perm of auditPermissions) {
      const permission = await prisma.permission.findUnique({
        where: { code: perm.code },
      });
      if (permission) {
        await prisma.permissionGroupPermission.upsert({
          where: {
            groupId_permissionId: {
              groupId: adminGroup.id,
              permissionId: permission.id,
            },
          },
          update: { effect: 'allow' },
          create: {
            groupId: adminGroup.id,
            permissionId: permission.id,
            effect: 'allow',
          },
        });
      }
    }

    // Atribuir usuário ao grupo admin
    await prisma.userPermissionGroup.upsert({
      where: {
        userId_groupId: {
          userId: userResponse.user.id,
          groupId: adminGroup.id,
        },
      },
      update: {},
      create: {
        userId: userResponse.user.id,
        groupId: adminGroup.id,
      },
    });
  }

  const authResponse = await request(app.server)
    .post('/v1/auth/login/password')
    .send({
      email: fakeEmail,
      password: 'Pass@123',
    });

  const { token, refreshToken, sessionId } = authResponse.body;

  return {
    user: userResponse,
    token,
    refreshToken,
    sessionId,
  };
}
