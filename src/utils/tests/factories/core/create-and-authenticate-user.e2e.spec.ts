import { app } from '@/app';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createAndAuthenticateUser } from './create-and-authenticate-user.e2e';

// Este teste valida a factory de criação + autenticação

describe('createAndAuthenticateUser factory (e2e)', () => {
  beforeAll(async () => {
    if (!app.server.listening) {
      await app.ready();
    }
  });

  it('deve criar um usuário e autenticar retornando tokens', async () => {
    const { user, token, refreshToken, sessionId } =
      await createAndAuthenticateUser(app);

    expect(user).toBeDefined();
    expect(user.user).toBeDefined();
    expect(user.user.id).toBeTruthy();
    expect(user.user.email).toMatch(/@/);

    expect(token).toBeTypeOf('string');
    expect(refreshToken).toBeTypeOf('string');
    expect(sessionId).toBeTypeOf('string');
  });

  it('deve permitir login subsequente com as mesmas credenciais', async () => {
    const { user } = await createAndAuthenticateUser(app);

    const loginResponse = await request(app.server)
      .post('/v1/auth/login/password')
      .send({
        email: user.user.email,
        password: 'Pass@123',
      });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.token).toBeDefined();
  });
});
