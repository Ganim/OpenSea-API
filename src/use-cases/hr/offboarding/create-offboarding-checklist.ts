import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  OffboardingChecklist,
  type OffboardingChecklistItem,
} from '@/entities/hr/offboarding-checklist';
import type { OffboardingChecklistsRepository } from '@/repositories/hr/offboarding-checklists-repository';
import { randomUUID } from 'node:crypto';

const DEFAULT_OFFBOARDING_ITEMS: Omit<
  OffboardingChecklistItem,
  'id' | 'completed' | 'completedAt'
>[] = [
  { title: 'Comunicar equipe sobre o desligamento' },
  { title: 'Realizar entrevista de desligamento' },
  { title: 'Coletar crachá e credenciais de acesso' },
  { title: 'Revogar acesso aos sistemas internos' },
  { title: 'Revogar acesso ao e-mail corporativo' },
  { title: 'Coletar equipamentos de trabalho (notebook, celular, etc.)' },
  { title: 'Realizar backup dos arquivos do colaborador' },
  { title: 'Processar cálculo de verbas rescisórias' },
  { title: 'Agendar exame demissional (ASO)' },
  { title: 'Emitir TRCT e documentação final' },
  { title: 'Dar baixa na CTPS' },
  { title: 'Gerar guias de seguro-desemprego (se aplicável)' },
  { title: 'Transferir responsabilidades e projetos' },
  { title: 'Cancelar benefícios e planos' },
];

export interface CreateOffboardingChecklistInput {
  tenantId: string;
  employeeId: string;
  terminationId?: string;
  title?: string;
  items?: Omit<OffboardingChecklistItem, 'id' | 'completed' | 'completedAt'>[];
}

export interface CreateOffboardingChecklistOutput {
  checklist: OffboardingChecklist;
}

export class CreateOffboardingChecklistUseCase {
  constructor(
    private offboardingChecklistsRepository: OffboardingChecklistsRepository,
  ) {}

  async execute(
    input: CreateOffboardingChecklistInput,
  ): Promise<CreateOffboardingChecklistOutput> {
    const { tenantId, employeeId, terminationId, title, items } = input;

    const existingChecklist =
      await this.offboardingChecklistsRepository.findByEmployeeId(
        new UniqueEntityID(employeeId),
        tenantId,
      );

    if (existingChecklist) {
      throw new BadRequestError(
        'Offboarding checklist already exists for this employee',
      );
    }

    const checklistItems: OffboardingChecklistItem[] = (
      items ?? DEFAULT_OFFBOARDING_ITEMS
    ).map((item) => ({
      id: randomUUID(),
      title: item.title,
      description: item.description,
      completed: false,
    }));

    const checklist = OffboardingChecklist.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      terminationId: terminationId ? new UniqueEntityID(terminationId) : null,
      title: title ?? 'Checklist de Desligamento',
      items: checklistItems,
    });

    await this.offboardingChecklistsRepository.create(checklist);

    return { checklist };
  }
}
