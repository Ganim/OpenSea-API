import type { FastifyInstance } from 'fastify';
import { hideItemController } from './v1-hide-item.controller';
import { protectItemController } from './v1-protect-item.controller';
import { unhideItemController } from './v1-unhide-item.controller';
import { unprotectItemController } from './v1-unprotect-item.controller';
import { verifyProtectionController } from './v1-verify-protection.controller';
import { verifySecurityKeyController } from './v1-verify-security-key.controller';

export async function storageSecurityRoutes(app: FastifyInstance) {
  await protectItemController(app);
  await unprotectItemController(app);
  await verifyProtectionController(app);
  await hideItemController(app);
  await unhideItemController(app);
  await verifySecurityKeyController(app);
}
