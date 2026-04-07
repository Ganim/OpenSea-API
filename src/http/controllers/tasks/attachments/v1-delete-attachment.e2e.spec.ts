import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('Delete Attachment (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should delete an attachment', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    const storageFolder = await prisma.storageFolder.create({
      data: {
        tenantId,
        name: 'Test',
        slug: `test-${Date.now()}`,
        path: `/test-${Date.now()}`,
        createdBy: userId,
      },
    });
    const storageFile = await prisma.storageFile.create({
      data: {
        tenantId,
        folderId: storageFolder.id,
        name: 'test.txt',
        originalName: 'test.txt',
        fileKey: `test-key-${Date.now()}`,
        path: `/test/test.txt`,
        size: 100,
        mimeType: 'text/plain',
        fileType: 'document',
        uploadedBy: userId,
      },
    });
    const attachment = await prisma.cardAttachment.create({
      data: { cardId: card.id, fileId: storageFile.id, addedBy: userId },
    });

    const response = await request(app.server)
      .delete(
        `/v1/tasks/boards/${board.id}/cards/${card.id}/attachments/${attachment.id}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
