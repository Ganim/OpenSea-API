import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Delete Template (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to delete a template', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    // Create template
    const createResponse = await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Template to Delete ${Date.now()}`,
        productAttributes: { color: 'string' },
      });

    const templateId = createResponse.body.template.id;

    // Delete template
    const deleteResponse = await request(app.server)
      .delete(`/v1/templates/${templateId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(deleteResponse.statusCode).toEqual(204);

    // Verify template is not in list (soft deleted)
    const listResponse = await request(app.server)
      .get('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send();

    const deletedTemplate = listResponse.body.templates.find(
      (t: { id: string }) => t.id === templateId,
    );
    expect(deletedTemplate).toBeUndefined();
  });

  it('should return 404 when deleting non-existing template', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const fakeId = 'f8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8';

    const response = await request(app.server)
      .delete(`/v1/templates/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
    expect(response.body.message).toEqual('Template not found');
  });

  it('should not be able to delete template without authentication', async () => {
    const response = await request(app.server)
      .delete('/v1/templates/f8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8')
      .send();

    expect(response.statusCode).toEqual(401);
  });
});
