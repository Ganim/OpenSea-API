import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

// Terminals
import { v1CreateTerminalController } from './terminals/v1-create-terminal.controller';
import { v1ListTerminalsController } from './terminals/v1-list-terminals.controller';
import { v1UpdateTerminalController } from './terminals/v1-update-terminal.controller';
import { v1DeleteTerminalController } from './terminals/v1-delete-terminal.controller';
import { v1GetPairingCodeController } from './terminals/v1-get-pairing-code.controller';
import { v1PairThisDeviceController } from './terminals/v1-pair-this-device.controller';
import { v1UnpairDeviceController } from './terminals/v1-unpair-device.controller';
import { v1AssignOperatorController } from './terminals/v1-assign-operator.controller';
import { v1RevokeOperatorController } from './terminals/v1-revoke-operator.controller';
import { v1ListTerminalOperatorsController } from './terminals/v1-list-terminal-operators.controller';
import { v1UpdateSessionModeController } from './terminals/v1-update-session-mode.controller';
import { v1AssignTerminalZoneController } from './terminals/v1-assign-terminal-zone.controller';
import { v1UnassignTerminalZoneController } from './terminals/v1-unassign-terminal-zone.controller';

// Devices
import { v1PairDeviceController } from './devices/v1-pair-device.controller';
import { v1GetMyDeviceController } from './devices/v1-get-my-device.controller';

// Sessions
import { v1OpenSessionController } from './sessions/v1-open-session.controller';
import { v1OpenTotemSessionController } from './sessions/v1-open-totem-session.controller';
import { v1CloseSessionController } from './sessions/v1-close-session.controller';
import { v1CloseOrphanSessionController } from './sessions/v1-close-orphan-session.controller';
import { v1GetActiveSessionController } from './sessions/v1-get-active-session.controller';
import { v1ListSessionsController } from './sessions/v1-list-sessions.controller';
import { v1GetSessionSummaryController } from './sessions/v1-get-session-summary.controller';

// Transactions
import { v1CreateTransactionController } from './transactions/v1-create-transaction.controller';
import { v1CancelTransactionController } from './transactions/v1-cancel-transaction.controller';
import { v1ListTransactionsController } from './transactions/v1-list-transactions.controller';

// Cash
import { v1CashMovementController } from './cash/v1-cash-movement.controller';

// Catalog (device-authenticated)
import { posCatalogRoutes } from './catalog/routes';

// Sales (device-authenticated)
import { posSalesRoutes } from './sales/routes';

// Conflicts (admin)
import { posConflictsRoutes } from './conflicts/routes';

// Fiscal (admin GET/PUT + device emit) — Emporion Plan A Task 32
import { posFiscalRoutes } from './fiscal/routes';

export async function posRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Terminals
  await app.register(v1ListTerminalsController);
  await app.register(v1CreateTerminalController);
  await app.register(v1UpdateTerminalController);
  await app.register(v1DeleteTerminalController);
  await app.register(v1GetPairingCodeController);
  await app.register(v1PairThisDeviceController);
  await app.register(v1UnpairDeviceController);
  await app.register(v1AssignOperatorController);
  await app.register(v1RevokeOperatorController);
  await app.register(v1ListTerminalOperatorsController);
  await app.register(v1UpdateSessionModeController);
  await app.register(v1AssignTerminalZoneController);
  await app.register(v1UnassignTerminalZoneController);

  // Devices
  await app.register(v1PairDeviceController);
  await app.register(v1GetMyDeviceController);

  // Sessions
  await app.register(v1OpenSessionController);
  await app.register(v1OpenTotemSessionController);
  await app.register(v1CloseSessionController);
  await app.register(v1CloseOrphanSessionController);
  await app.register(v1GetActiveSessionController);
  await app.register(v1ListSessionsController);
  await app.register(v1GetSessionSummaryController);

  // Transactions
  await app.register(v1CreateTransactionController);
  await app.register(v1CancelTransactionController);
  await app.register(v1ListTransactionsController);

  // Cash
  await app.register(v1CashMovementController);

  // Catalog (device-authenticated)
  await app.register(posCatalogRoutes);

  // Sales (device-authenticated)
  await app.register(posSalesRoutes);

  // Conflicts (admin)
  await app.register(posConflictsRoutes);

  // Fiscal (admin GET/PUT + device emit) — Emporion Plan A Task 32
  await app.register(posFiscalRoutes);
}
