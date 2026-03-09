import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { hideItemController } from './v1-hide-item.controller';
import { protectItemController } from './v1-protect-item.controller';
import { unhideItemController } from './v1-unhide-item.controller';
import { unprotectItemController } from './v1-unprotect-item.controller';
import { verifyProtectionController } from './v1-verify-protection.controller';
import { verifySecurityKeyController } from './v1-verify-security-key.controller';

export async function storageSecurityRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STORAGE'));

  await protectItemController(app);
  await unprotectItemController(app);
  await hideItemController(app);
  await unhideItemController(app);
  await verifySecurityKeyController(app);

  // Verify protection has per-item rate limiting to prevent password brute-force
  app.register(
    async (verifyApp) => {
      verifyApp.register(rateLimit, {
        ...rateLimitConfig.protectionVerify,
        keyGenerator: (req: FastifyRequest) => {
          const body = req.body as { itemId?: string } | undefined;
          return body?.itemId
            ? `protection:${body.itemId}:${req.ip}`
            : req.ip;
        },
      });
      verifyApp.register(verifyProtectionController);
    },
    { prefix: '' },
  );
}
