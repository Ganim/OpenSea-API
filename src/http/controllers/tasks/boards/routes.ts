import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { archiveBoardController } from './v1-archive-board.controller';
import { createBoardController } from './v1-create-board.controller';
import { deleteBoardController } from './v1-delete-board.controller';
import { getBoardController } from './v1-get-board.controller';
import { inviteBoardMemberController } from './v1-invite-board-member.controller';
import { listBoardsController } from './v1-list-boards.controller';
import { removeBoardMemberController } from './v1-remove-board-member.controller';
import { updateBoardController } from './v1-update-board.controller';
import { updateBoardMemberController } from './v1-update-board-member.controller';

export async function taskBoardsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('TASKS'));

  app.register(createBoardController);
  app.register(updateBoardController);
  app.register(deleteBoardController);
  app.register(getBoardController);
  app.register(listBoardsController);
  app.register(archiveBoardController);
  app.register(inviteBoardMemberController);
  app.register(updateBoardMemberController);
  app.register(removeBoardMemberController);
}
