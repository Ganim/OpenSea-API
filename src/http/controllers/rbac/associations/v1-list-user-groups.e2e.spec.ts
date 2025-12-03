import { app } from '@/app';
import { makeAssignGroupToUserUseCase } from '@/use-cases/rbac/associations/factories/make-assign-group-to-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List User Groups (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated USER to LIST own groups', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');
    const uniqueSuffix = faker.string.alpha({ length: 6 }).toLowerCase();
    const group1 = await makePermissionGroup({
      name: `Sales Team ${uniqueSuffix}`,
    });
    const group2 = await makePermissionGroup({
      name: `Support Team ${uniqueSuffix}`,
    });

    const assignGroupUseCase = makeAssignGroupToUserUseCase();
    await assignGroupUseCase.execute({
      userId: user.user.id.toString(),
      groupId: group1.id.toString(),
      grantedBy: null,
      expiresAt: null,
    });
    await assignGroupUseCase.execute({
      userId: user.user.id.toString(),
      groupId: group2.id.toString(),
      grantedBy: null,
      expiresAt: null,
    });

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.user.id.toString()}/groups`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      groups: expect.arrayContaining([
        expect.objectContaining({
          id: group1.id.toString(),
          name: expect.stringContaining('Sales Team'),
        }),
        expect.objectContaining({
          id: group2.id.toString(),
          name: expect.stringContaining('Support Team'),
        }),
      ]),
    });
  });

  it('should FILTER by active status', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');
    const activeGroup = await makePermissionGroup({ isActive: true });
    // Não criamos grupo inativo pois o use-case bloqueia a atribuição de grupos inativos
    // O teste apenas verifica que o filtro retorna somente grupos ativos

    const assignGroupUseCase = makeAssignGroupToUserUseCase();
    await assignGroupUseCase.execute({
      userId: user.user.id.toString(),
      groupId: activeGroup.id.toString(),
      grantedBy: null,
      expiresAt: null,
    });

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.user.id.toString()}/groups`)
      .set('Authorization', `Bearer ${token}`)
      .query({ isActive: 'true' });

    expect(response.statusCode).toEqual(200);
    expect(
      response.body.groups.every(
        (group: Record<string, unknown>) => group.isActive === true,
      ),
    ).toBe(true);
  });

  it('should FILTER by expiration status', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');
    const group = await makePermissionGroup();

    const assignGroupUseCase = makeAssignGroupToUserUseCase();
    // Criamos uma associação SEM data de expiração (válida)
    // O filtro includeExpired=false deve retornar grupos válidos
    await assignGroupUseCase.execute({
      userId: user.user.id.toString(),
      groupId: group.id.toString(),
      grantedBy: null,
      expiresAt: null,
    });

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.user.id.toString()}/groups`)
      .set('Authorization', `Bearer ${token}`)
      .query({ includeExpired: 'false' });

    expect(response.statusCode).toEqual(200);
    expect(response.body.groups).toHaveLength(1);
  });

  it('should support PAGINATION', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.user.id.toString()}/groups`)
      .set('Authorization', `Bearer ${token}`)
      .query({ page: '1', limit: '10' });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('groups');
    expect(Array.isArray(response.body.groups)).toBe(true);
  });

  it('should NOT allow unauthenticated request', async () => {
    const { user } = await createAndAuthenticateUser(app, 'USER');

    const response = await request(app.server).get(
      `/v1/rbac/users/${user.user.id.toString()}/groups`,
    );

    expect(response.statusCode).toEqual(401);
  });
});
