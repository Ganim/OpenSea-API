import type { FastifyInstance } from 'fastify';
import { addRequestCommentController } from './v1-add-request-comment.controller';
import { assignRequestController } from './v1-assign-request.controller';
import { cancelRequestController } from './v1-cancel-request.controller';
import { completeRequestController } from './v1-complete-request.controller';
import { createRequestController } from './v1-create-request.controller';
import { getRequestByIdController } from './v1-get-request-by-id.controller';
import { listRequestsController } from './v1-list-requests.controller';
import { provideInfoController } from './v1-provide-info.controller';
import { requestInfoController } from './v1-request-info.controller';

export async function requestsRoutes(app: FastifyInstance) {
  await createRequestController(app);
  await getRequestByIdController(app);
  await listRequestsController(app);
  await assignRequestController(app);
  await completeRequestController(app);
  await cancelRequestController(app);
  await requestInfoController(app);
  await provideInfoController(app);
  await addRequestCommentController(app);
}
