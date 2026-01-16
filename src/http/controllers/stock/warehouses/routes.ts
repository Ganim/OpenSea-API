import type { FastifyInstance } from 'fastify';
import { createWarehouseController } from './v1-create-warehouse.controller';
import { updateWarehouseController } from './v1-update-warehouse.controller';
import { deleteWarehouseController } from './v1-delete-warehouse.controller';
import { getWarehouseByIdController } from './v1-get-warehouse-by-id.controller';
import { listWarehousesController } from './v1-list-warehouses.controller';

export async function warehousesRoutes(app: FastifyInstance) {
  await createWarehouseController(app);
  await updateWarehouseController(app);
  await deleteWarehouseController(app);
  await getWarehouseByIdController(app);
  await listWarehousesController(app);
}
