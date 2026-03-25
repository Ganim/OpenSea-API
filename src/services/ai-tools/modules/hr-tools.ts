import type { ToolDefinition } from '@/services/ai-tools/tool-types';

export function getHrTools(): ToolDefinition[] {
  return [
    // =========================================================
    // QUERY TOOLS (10)
    // =========================================================
    {
      name: 'hr_list_employees',
      description:
        'Lista funcionários cadastrados com filtros opcionais por status, departamento, cargo ou nome',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Busca por nome do funcionário',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'ON_LEAVE', 'VACATION', 'SUSPENDED', 'TERMINATED'],
            description: 'Filtrar por status do funcionário',
          },
          departmentId: {
            type: 'string',
            description: 'Filtrar por departamento (ID)',
          },
          positionId: {
            type: 'string',
            description: 'Filtrar por cargo (ID)',
          },
          limit: {
            type: 'number',
            description: 'Máximo de resultados (padrão 10, máximo 20)',
          },
          page: {
            type: 'number',
            description: 'Página de resultados (padrão 1)',
          },
        },
      },
      module: 'hr',
      permission: 'hr.employees.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'hr_get_employee',
      description:
        'Obtém os detalhes completos de um funcionário específico pelo ID ou nome',
      parameters: {
        type: 'object',
        properties: {
          employeeId: { type: 'string', description: 'ID do funcionário' },
          name: {
            type: 'string',
            description: 'Nome do funcionário (busca parcial)',
          },
        },
      },
      module: 'hr',
      permission: 'hr.employees.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'hr_list_departments',
      description:
        'Lista departamentos cadastrados com filtros opcionais por nome ou status',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Busca por nome do departamento',
          },
          isActive: {
            type: 'boolean',
            description: 'Filtrar por departamentos ativos ou inativos',
          },
          limit: {
            type: 'number',
            description: 'Máximo de resultados (padrão 10, máximo 20)',
          },
          page: {
            type: 'number',
            description: 'Página de resultados (padrão 1)',
          },
        },
      },
      module: 'hr',
      permission: 'hr.departments.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'hr_list_positions',
      description:
        'Lista cargos cadastrados com filtros opcionais por departamento, nível ou nome',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Busca por nome do cargo',
          },
          departmentId: {
            type: 'string',
            description: 'Filtrar por departamento (ID)',
          },
          isActive: {
            type: 'boolean',
            description: 'Filtrar por cargos ativos ou inativos',
          },
          level: {
            type: 'number',
            description: 'Filtrar por nível hierárquico',
          },
          limit: {
            type: 'number',
            description: 'Máximo de resultados (padrão 10, máximo 20)',
          },
          page: {
            type: 'number',
            description: 'Página de resultados (padrão 1)',
          },
        },
      },
      module: 'hr',
      permission: 'hr.positions.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'hr_list_work_schedules',
      description:
        'Lista escalas de trabalho cadastradas com filtro opcional por ativas',
      parameters: {
        type: 'object',
        properties: {
          activeOnly: {
            type: 'boolean',
            description: 'Mostrar apenas escalas ativas',
          },
        },
      },
      module: 'hr',
      permission: 'hr.work-schedules.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'hr_get_work_schedule',
      description:
        'Obtém os detalhes completos de uma escala de trabalho específica',
      parameters: {
        type: 'object',
        properties: {
          workScheduleId: {
            type: 'string',
            description: 'ID da escala de trabalho',
          },
        },
        required: ['workScheduleId'],
      },
      module: 'hr',
      permission: 'hr.work-schedules.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'hr_list_absences',
      description:
        'Lista ausências/afastamentos com filtros por funcionário, tipo, status ou período',
      parameters: {
        type: 'object',
        properties: {
          employeeId: {
            type: 'string',
            description: 'Filtrar por funcionário (ID)',
          },
          type: {
            type: 'string',
            enum: [
              'VACATION',
              'SICK_LEAVE',
              'MATERNITY',
              'PATERNITY',
              'BEREAVEMENT',
              'PERSONAL',
              'OTHER',
            ],
            description: 'Tipo de ausência',
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
            description: 'Status da ausência',
          },
          startDate: {
            type: 'string',
            description: 'Data inicial do período (ISO 8601)',
          },
          endDate: {
            type: 'string',
            description: 'Data final do período (ISO 8601)',
          },
          limit: {
            type: 'number',
            description: 'Máximo de resultados (padrão 10, máximo 20)',
          },
          page: {
            type: 'number',
            description: 'Página de resultados (padrão 1)',
          },
        },
      },
      module: 'hr',
      permission: 'hr.absences.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'hr_list_vacation_periods',
      description:
        'Lista períodos aquisitivos de férias com filtros por funcionário, status ou ano',
      parameters: {
        type: 'object',
        properties: {
          employeeId: {
            type: 'string',
            description: 'Filtrar por funcionário (ID)',
          },
          status: {
            type: 'string',
            description: 'Filtrar por status do período',
          },
          year: {
            type: 'number',
            description: 'Filtrar por ano do período aquisitivo',
          },
        },
      },
      module: 'hr',
      permission: 'hr.vacations.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'hr_get_vacation_balance',
      description:
        'Calcula o saldo de férias de um funcionário, com detalhes por período aquisitivo',
      parameters: {
        type: 'object',
        properties: {
          employeeId: {
            type: 'string',
            description: 'ID do funcionário',
          },
        },
        required: ['employeeId'],
      },
      module: 'hr',
      permission: 'hr.vacations.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'hr_list_payrolls',
      description:
        'Lista folhas de pagamento com filtros por mês, ano ou status',
      parameters: {
        type: 'object',
        properties: {
          referenceMonth: {
            type: 'number',
            description: 'Mês de referência (1-12)',
          },
          referenceYear: {
            type: 'number',
            description: 'Ano de referência (ex: 2026)',
          },
          status: {
            type: 'string',
            description: 'Filtrar por status da folha',
          },
          limit: {
            type: 'number',
            description: 'Máximo de resultados (padrão 10, máximo 20)',
          },
          page: {
            type: 'number',
            description: 'Página de resultados (padrão 1)',
          },
        },
      },
      module: 'hr',
      permission: 'hr.payroll.access',
      requiresConfirmation: false,
      category: 'query',
    },

    // =========================================================
    // ACTION TOOLS (7)
    // =========================================================
    {
      name: 'hr_create_employee',
      description: 'Cadastra um novo funcionário no sistema de RH',
      parameters: {
        type: 'object',
        properties: {
          fullName: {
            type: 'string',
            description: 'Nome completo do funcionário',
          },
          cpf: {
            type: 'string',
            description: 'CPF do funcionário (apenas dígitos)',
          },
          registrationNumber: {
            type: 'string',
            description: 'Número de matrícula do funcionário',
          },
          email: {
            type: 'string',
            description: 'E-mail corporativo do funcionário',
          },
          phone: {
            type: 'string',
            description: 'Telefone do funcionário',
          },
          departmentId: {
            type: 'string',
            description: 'ID do departamento',
          },
          positionId: {
            type: 'string',
            description: 'ID do cargo',
          },
          hireDate: {
            type: 'string',
            description: 'Data de admissão (ISO 8601)',
          },
          baseSalary: {
            type: 'number',
            description: 'Salário base mensal',
          },
          contractType: {
            type: 'string',
            enum: ['CLT', 'PJ', 'INTERN', 'TEMPORARY', 'APPRENTICE'],
            description: 'Tipo de contrato (padrão: CLT)',
          },
          workRegime: {
            type: 'string',
            enum: ['FULL_TIME', 'PART_TIME', 'HOURLY', 'SHIFT', 'FLEXIBLE'],
            description: 'Regime de trabalho (padrão: FULL_TIME)',
          },
          weeklyHours: {
            type: 'number',
            description: 'Carga horária semanal (padrão: 44)',
          },
          gender: {
            type: 'string',
            description: 'Gênero do funcionário',
          },
          birthDate: {
            type: 'string',
            description: 'Data de nascimento (ISO 8601)',
          },
        },
        required: [
          'fullName',
          'cpf',
          'registrationNumber',
          'hireDate',
          'contractType',
          'workRegime',
          'weeklyHours',
        ],
      },
      module: 'hr',
      permission: 'hr.employees.register',
      requiresConfirmation: true,
      category: 'action',
    },
    {
      name: 'hr_update_employee',
      description: 'Atualiza os dados de um funcionário existente',
      parameters: {
        type: 'object',
        properties: {
          employeeId: {
            type: 'string',
            description: 'ID do funcionário a atualizar',
          },
          fullName: {
            type: 'string',
            description: 'Novo nome completo',
          },
          email: {
            type: 'string',
            description: 'Novo e-mail corporativo',
          },
          phone: {
            type: 'string',
            description: 'Novo telefone',
          },
          departmentId: {
            type: 'string',
            description: 'Novo departamento (ID)',
          },
          positionId: {
            type: 'string',
            description: 'Novo cargo (ID)',
          },
          baseSalary: {
            type: 'number',
            description: 'Novo salário base',
          },
          contractType: {
            type: 'string',
            enum: ['CLT', 'PJ', 'INTERN', 'TEMPORARY', 'APPRENTICE'],
            description: 'Novo tipo de contrato',
          },
          workRegime: {
            type: 'string',
            enum: ['FULL_TIME', 'PART_TIME', 'HOURLY', 'SHIFT', 'FLEXIBLE'],
            description: 'Novo regime de trabalho',
          },
          weeklyHours: {
            type: 'number',
            description: 'Nova carga horária semanal',
          },
        },
        required: ['employeeId'],
      },
      module: 'hr',
      permission: 'hr.employees.modify',
      requiresConfirmation: true,
      category: 'action',
    },
    {
      name: 'hr_create_department',
      description: 'Cria um novo departamento na organização',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nome do departamento' },
          code: {
            type: 'string',
            description: 'Código único do departamento',
          },
          description: {
            type: 'string',
            description: 'Descrição do departamento',
          },
          companyId: {
            type: 'string',
            description: 'ID da empresa',
          },
          parentId: {
            type: 'string',
            description: 'ID do departamento pai (para sub-departamentos)',
          },
          managerId: {
            type: 'string',
            description: 'ID do gerente do departamento',
          },
        },
        required: ['name', 'code', 'companyId'],
      },
      module: 'hr',
      permission: 'hr.departments.register',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'hr_create_position',
      description: 'Cria um novo cargo na organização',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nome do cargo' },
          code: { type: 'string', description: 'Código único do cargo' },
          description: {
            type: 'string',
            description: 'Descrição do cargo',
          },
          departmentId: {
            type: 'string',
            description: 'ID do departamento vinculado',
          },
          level: {
            type: 'number',
            description: 'Nível hierárquico (1 = mais baixo)',
          },
          minSalary: {
            type: 'number',
            description: 'Salário mínimo da faixa do cargo',
          },
          maxSalary: {
            type: 'number',
            description: 'Salário máximo da faixa do cargo',
          },
        },
        required: ['name', 'code'],
      },
      module: 'hr',
      permission: 'hr.positions.register',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'hr_request_sick_leave',
      description:
        'Registra um atestado médico (licença médica) para um funcionário',
      parameters: {
        type: 'object',
        properties: {
          employeeId: {
            type: 'string',
            description: 'ID do funcionário',
          },
          startDate: {
            type: 'string',
            description: 'Data início do afastamento (ISO 8601)',
          },
          endDate: {
            type: 'string',
            description: 'Data fim do afastamento (ISO 8601)',
          },
          cid: {
            type: 'string',
            description: 'Código CID do atestado médico',
          },
          reason: {
            type: 'string',
            description: 'Motivo ou observações',
          },
        },
        required: ['employeeId', 'startDate', 'endDate', 'cid'],
      },
      module: 'hr',
      permission: 'hr.absences.register',
      requiresConfirmation: true,
      category: 'action',
    },
    {
      name: 'hr_request_vacation',
      description:
        'Solicita férias para um funcionário vinculando a um período aquisitivo',
      parameters: {
        type: 'object',
        properties: {
          employeeId: {
            type: 'string',
            description: 'ID do funcionário',
          },
          vacationPeriodId: {
            type: 'string',
            description: 'ID do período aquisitivo de férias',
          },
          startDate: {
            type: 'string',
            description: 'Data início das férias (ISO 8601)',
          },
          endDate: {
            type: 'string',
            description: 'Data fim das férias (ISO 8601)',
          },
          reason: {
            type: 'string',
            description: 'Motivo ou observações',
          },
        },
        required: ['employeeId', 'vacationPeriodId', 'startDate', 'endDate'],
      },
      module: 'hr',
      permission: 'hr.vacations.register',
      requiresConfirmation: true,
      category: 'action',
    },
    {
      name: 'hr_approve_absence',
      description: 'Aprova uma ausência/afastamento pendente de um funcionário',
      parameters: {
        type: 'object',
        properties: {
          absenceId: {
            type: 'string',
            description: 'ID da ausência a aprovar',
          },
        },
        required: ['absenceId'],
      },
      module: 'hr',
      permission: 'hr.absences.admin',
      requiresConfirmation: true,
      category: 'action',
    },

    // =========================================================
    // REPORT TOOLS (4)
    // =========================================================
    {
      name: 'hr_headcount_summary',
      description:
        'Resumo de headcount com totais por status, departamento e tipo de contrato',
      parameters: {
        type: 'object',
        properties: {
          departmentId: {
            type: 'string',
            description: 'Filtrar por departamento específico (ID)',
          },
        },
      },
      module: 'hr',
      permission: 'hr.employees.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'hr_department_distribution',
      description:
        'Relatório de distribuição de funcionários por departamento com contagens e percentuais',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ACTIVE', 'ON_LEAVE', 'VACATION', 'SUSPENDED', 'TERMINATED'],
            description: 'Filtrar por status do funcionário (padrão: ACTIVE)',
          },
        },
      },
      module: 'hr',
      permission: 'hr.employees.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'hr_absence_rate_report',
      description:
        'Relatório de taxa de absenteísmo com totais por tipo e período',
      parameters: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            description: 'Data inicial do período (ISO 8601)',
          },
          endDate: {
            type: 'string',
            description: 'Data final do período (ISO 8601)',
          },
          employeeId: {
            type: 'string',
            description: 'Filtrar por funcionário específico (ID)',
          },
        },
        required: ['startDate', 'endDate'],
      },
      module: 'hr',
      permission: 'hr.absences.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'hr_payroll_summary',
      description:
        'Resumo da folha de pagamento de um mês/ano com totais de proventos, descontos e líquido',
      parameters: {
        type: 'object',
        properties: {
          referenceMonth: {
            type: 'number',
            description: 'Mês de referência (1-12)',
          },
          referenceYear: {
            type: 'number',
            description: 'Ano de referência (ex: 2026)',
          },
        },
        required: ['referenceMonth', 'referenceYear'],
      },
      module: 'hr',
      permission: 'hr.payroll.access',
      requiresConfirmation: false,
      category: 'report',
    },
  ];
}
