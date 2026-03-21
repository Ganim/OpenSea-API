import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { addCardMemberController } from './v1-add-card-member.controller';
import { removeCardMemberController } from './v1-remove-card-member.controller';
import { listCardMembersController } from './v1-list-card-members.controller';

export async function taskMembersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('TASKS'));

  app.register(addCardMemberController);
  app.register(removeCardMemberController);
  app.register(listCardMembersController);
}
