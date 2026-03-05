import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('Upload Attachment (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should upload an attachment to a card', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    // Create a storage file for testing
    const storageFolder = await prisma.storageFolder.create({
      data: { tenantId, name: 'Test', createdBy: userId, type: 'USER' },
    });
    const storageFile = await prisma.storageFile.create({
      data: {
        tenantId,
        folderId: storageFolder.id,
        name: 'test.txt',
        key: `test-key-${Date.now()}`,
        size: 100,
        mimeType: 'text/plain',
        uploadedBy: userId,
      },
    });

    const response = await request(app.server)
      .post(`/v1/tasks/boards/${board.id}/cards/${card.id}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fileId: storageFile.id, fileName: 'test.txt' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('attachment');
    expect(response.body.attachment).toHaveProperty('id');
    expect(response.body.attachment.fileId).toBe(storageFile.id);
  });
});
