import type { CalendarsRepository } from '@/repositories/calendar/calendars-repository';

const SYSTEM_MODULES = [
  { module: 'HR', name: 'RH', color: '#8b5cf6' },
  { module: 'FINANCE', name: 'Financeiro', color: '#10b981' },
  { module: 'STOCK', name: 'Estoque', color: '#f59e0b' },
] as const;

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

interface EnsureSystemCalendarsRequest {
  tenantId: string;
}

export class EnsureSystemCalendarsUseCase {
  constructor(private calendarsRepository: CalendarsRepository) {}

  async execute(request: EnsureSystemCalendarsRequest): Promise<void> {
    const { tenantId } = request;

    for (const { module, name, color } of SYSTEM_MODULES) {
      const existing = await this.calendarsRepository.findSystemByModule(
        module,
        tenantId,
      );
      if (!existing) {
        await this.calendarsRepository.create({
          tenantId,
          name: `Calendário ${name}`,
          color,
          type: 'SYSTEM',
          systemModule: module,
          isDefault: false,
          createdBy: SYSTEM_USER_ID,
        });
      }
    }
  }
}
