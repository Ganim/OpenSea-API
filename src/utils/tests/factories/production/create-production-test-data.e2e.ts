import { prisma } from '@/lib/prisma';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createWarehouse } from '@/utils/tests/factories/stock/create-warehouse.e2e';

interface CreateProductionTestDataProps {
  tenantId: string;
  userId: string;
}

/**
 * Creates all prerequisite production data for E2E tests:
 * Product, Warehouse, BOM, OperationRouting, ProductionOrder, JobCard
 */
export async function createProductionTestData(
  props: CreateProductionTestDataProps,
) {
  const { tenantId, userId } = props;
  const ts = Date.now();

  // Create product + warehouse
  const { productId } = await createProduct({ tenantId });
  const { warehouseId } = await createWarehouse({ tenantId });

  // Create workstation type
  const workstationType = await prisma.productionWorkstationType.create({
    data: {
      tenantId,
      name: `WS Type ${ts}`,
      description: 'Test workstation type',
    },
  });

  // Create workstation
  const workstation = await prisma.productionWorkstation.create({
    data: {
      tenantId,
      workstationTypeId: workstationType.id,
      code: `WS-${ts}`,
      name: `Workstation ${ts}`,
      capacityPerDay: 8,
    },
  });

  // Create BOM
  const bom = await prisma.productionBom.create({
    data: {
      tenantId,
      productId,
      name: `BOM ${ts}`,
      version: 1,
      status: 'ACTIVE',
      createdById: userId,
    },
  });

  // Create operation routing
  const operationRouting = await prisma.productionOperationRouting.create({
    data: {
      tenantId,
      bomId: bom.id,
      workstationId: workstation.id,
      sequence: 1,
      operationName: `Op ${ts}`,
      executionTime: 60,
    },
  });

  // Create production order
  const productionOrder = await prisma.productionOrder.create({
    data: {
      tenantId,
      orderNumber: `PO-${ts}`,
      bomId: bom.id,
      productId,
      status: 'RELEASED',
      quantityPlanned: 100,
      createdById: userId,
    },
  });

  // Create job card
  const jobCard = await prisma.productionJobCard.create({
    data: {
      productionOrderId: productionOrder.id,
      operationRoutingId: operationRouting.id,
      workstationId: workstation.id,
      status: 'PENDING',
      quantityPlanned: 100,
    },
  });

  // Create defect type
  const defectType = await prisma.productionDefectType.create({
    data: {
      tenantId,
      code: `DT-${ts}`,
      name: `Defect Type ${ts}`,
      severity: 'MAJOR',
    },
  });

  // Create inspection plan
  const inspectionPlan = await prisma.productionInspectionPlan.create({
    data: {
      operationRoutingId: operationRouting.id,
      inspectionType: 'VISUAL',
      sampleSize: 10,
    },
  });

  return {
    productId,
    warehouseId,
    workstationType,
    workstation,
    bom,
    operationRouting,
    productionOrder,
    jobCard,
    defectType,
    inspectionPlan,
  };
}
