import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { prisma } from '@/lib/prisma';

export interface GetTableItemsRequest {
  tableCode: string;
  search?: string;
}

export interface TableItem {
  id: string;
  tableCode: string;
  itemCode: string;
  description: string;
  isActive: boolean;
}

export interface GetTableItemsResponse {
  items: TableItem[];
  total: number;
}

/**
 * Get all items from a specific eSocial reference table.
 */
export class GetTableItemsUseCase {
  async execute(
    request: GetTableItemsRequest,
  ): Promise<GetTableItemsResponse> {
    const where: any = {
      tableCode: request.tableCode,
      isActive: true,
    };

    if (request.search) {
      where.OR = [
        { itemCode: { contains: request.search, mode: 'insensitive' } },
        { description: { contains: request.search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.esocialTable.findMany({
      where,
      orderBy: { itemCode: 'asc' },
    });

    if (items.length === 0 && !request.search) {
      // Check if table exists at all
      const exists = await prisma.esocialTable.findFirst({
        where: { tableCode: request.tableCode },
      });
      if (!exists) {
        throw new ResourceNotFoundError(
          `Table '${request.tableCode}' not found`,
        );
      }
    }

    return {
      items: items.map((item) => ({
        id: item.id,
        tableCode: item.tableCode,
        itemCode: item.itemCode,
        description: item.description,
        isActive: item.isActive,
      })),
      total: items.length,
    };
  }
}
