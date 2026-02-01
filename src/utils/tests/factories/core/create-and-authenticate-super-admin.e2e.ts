import { prisma } from '@/lib/prisma';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';

/**
 * Creates a user with isSuperAdmin = true and authenticates them.
 * Used for E2E tests that require super admin access (/v1/admin/* routes).
 */
export async function createAndAuthenticateSuperAdmin(app: FastifyInstance) {
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const fakeEmail = `superadmin${uniqueId}@test.com`;
  const username = `sadm${uniqueId}`;

  const createUserUseCase = makeCreateUserUseCase();
  const userResponse = await createUserUseCase.execute({
    email: fakeEmail,
    password: 'Pass@123',
    username,
  });

  const userId = userResponse.user.id;

  // Promote user to super admin in the database
  await prisma.user.update({
    where: { id: userId },
    data: { isSuperAdmin: true },
  });

  // Authenticate - the JWT will now include isSuperAdmin: true
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
