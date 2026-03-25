import type { ModuleKnowledge } from '../module-knowledge.interface';

export const hrKnowledge: ModuleKnowledge = {
  module: 'hr',
  displayName: 'Recursos Humanos',
  description:
    'Gerencia funcionarios, departamentos, cargos, folha de pagamento, escalas de trabalho, ausencias, ferias e documentos.',
  version: '1.0.0',

  // ================================================================
  // ENTITIES
  // ================================================================
  entities: [
    {
      name: 'Employee',
      displayName: 'Funcionario',
      description:
        'Registro de um funcionario da empresa com dados pessoais, contratuais e profissionais.',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome completo do funcionario',
          example: 'Maria Silva Santos',
        },
        {
          name: 'email',
          displayName: 'E-mail',
          type: 'string',
          required: true,
          description: 'E-mail corporativo',
        },
        {
          name: 'cpf',
          displayName: 'CPF',
          type: 'string',
          required: true,
          description: 'CPF do funcionario (apenas digitos)',
        },
        {
          name: 'departmentId',
          displayName: 'Departamento',
          type: 'relation',
          required: false,
          description: 'Departamento do funcionario',
        },
        {
          name: 'positionId',
          displayName: 'Cargo',
          type: 'relation',
          required: false,
          description: 'Cargo/funcao do funcionario',
        },
        {
          name: 'status',
          displayName: 'Status',
          type: 'enum',
          required: false,
          description: 'Status do funcionario',
          enumValues: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'],
          defaultValue: 'ACTIVE',
        },
        {
          name: 'hireDate',
          displayName: 'Data de Admissao',
          type: 'date',
          required: true,
          description: 'Data de admissao na empresa',
        },
        {
          name: 'salary',
          displayName: 'Salario',
          type: 'number',
          required: false,
          description: 'Salario bruto em centavos',
        },
        {
          name: 'workScheduleId',
          displayName: 'Escala de Trabalho',
          type: 'relation',
          required: false,
          description: 'Escala de trabalho atribuida',
        },
      ],
      statusFlow: {
        statuses: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'],
        transitions: {
          ACTIVE: ['INACTIVE', 'ON_LEAVE', 'TERMINATED'],
          INACTIVE: ['ACTIVE', 'TERMINATED'],
          ON_LEAVE: ['ACTIVE', 'TERMINATED'],
        },
        initialStatus: 'ACTIVE',
        terminalStatuses: ['TERMINATED'],
      },
      relationships: [
        {
          entity: 'Department',
          type: 'belongs_to',
          description: 'Funcionario pertence a um departamento',
          required: false,
        },
        {
          entity: 'Position',
          type: 'belongs_to',
          description: 'Funcionario ocupa um cargo',
          required: false,
        },
        {
          entity: 'WorkSchedule',
          type: 'belongs_to',
          description: 'Funcionario segue uma escala de trabalho',
          required: false,
        },
        {
          entity: 'Absence',
          type: 'has_many',
          description: 'Funcionario pode ter ausencias registradas',
          required: false,
        },
        {
          entity: 'Vacation',
          type: 'has_many',
          description: 'Funcionario pode ter ferias programadas',
          required: false,
        },
      ],
      validations: [
        'Nome e obrigatorio',
        'E-mail e obrigatorio e deve ser unico no tenant',
        'CPF e obrigatorio e deve ser valido',
        'Data de admissao e obrigatoria',
        'Funcionarios TERMINATED nao podem ser reativados',
      ],
    },
    {
      name: 'Department',
      displayName: 'Departamento',
      description: 'Departamento da empresa para organizacao de funcionarios.',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome do departamento',
          example: 'Tecnologia',
        },
        {
          name: 'managerId',
          displayName: 'Gerente',
          type: 'relation',
          required: false,
          description: 'Funcionario responsavel pelo departamento',
        },
        {
          name: 'parentId',
          displayName: 'Departamento Pai',
          type: 'relation',
          required: false,
          description: 'Departamento hierarquicamente superior',
        },
      ],
      relationships: [
        {
          entity: 'Employee',
          type: 'has_many',
          description: 'Departamento tem muitos funcionarios',
          required: false,
        },
        {
          entity: 'Department',
          type: 'belongs_to',
          description: 'Subdepartamento pertence a um pai',
          required: false,
        },
      ],
      validations: ['Nome e obrigatorio'],
    },
    {
      name: 'Position',
      displayName: 'Cargo',
      description: 'Cargo/funcao que funcionarios podem ocupar.',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome do cargo',
          example: 'Desenvolvedor Senior',
        },
        {
          name: 'level',
          displayName: 'Nivel',
          type: 'enum',
          required: false,
          description: 'Nivel hierarquico',
          enumValues: [
            'JUNIOR',
            'MID',
            'SENIOR',
            'LEAD',
            'MANAGER',
            'DIRECTOR',
            'VP',
            'C_LEVEL',
          ],
        },
        {
          name: 'salaryRange',
          displayName: 'Faixa Salarial',
          type: 'object',
          required: false,
          description: 'Faixa salarial (min/max em centavos)',
        },
      ],
      relationships: [
        {
          entity: 'Employee',
          type: 'has_many',
          description: 'Cargo e ocupado por funcionarios',
          required: false,
        },
      ],
      validations: ['Nome e obrigatorio'],
    },
    {
      name: 'WorkSchedule',
      displayName: 'Escala de Trabalho',
      description:
        'Define horarios de trabalho, turnos e folgas para funcionarios.',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome da escala',
          example: 'Comercial 8h-17h',
        },
        {
          name: 'type',
          displayName: 'Tipo',
          type: 'enum',
          required: true,
          description: 'Tipo da escala',
          enumValues: ['FIXED', 'ROTATING', 'FLEXIBLE'],
        },
        {
          name: 'weeklyHours',
          displayName: 'Carga Horaria Semanal',
          type: 'number',
          required: false,
          description: 'Total de horas semanais',
          example: '44',
        },
      ],
      relationships: [
        {
          entity: 'Employee',
          type: 'has_many',
          description: 'Escala e atribuida a funcionarios',
          required: false,
        },
      ],
      validations: ['Nome e obrigatorio', 'Tipo e obrigatorio'],
    },
    {
      name: 'Absence',
      displayName: 'Ausencia',
      description:
        'Registro de ausencia de funcionario (falta, atestado, licenca).',
      fields: [
        {
          name: 'employeeId',
          displayName: 'Funcionario',
          type: 'relation',
          required: true,
          description: 'Funcionario ausente',
        },
        {
          name: 'type',
          displayName: 'Tipo',
          type: 'enum',
          required: true,
          description: 'Tipo de ausencia',
          enumValues: [
            'SICK_LEAVE',
            'PERSONAL',
            'BEREAVEMENT',
            'MATERNITY',
            'PATERNITY',
            'UNPAID',
            'OTHER',
          ],
        },
        {
          name: 'startDate',
          displayName: 'Data Inicio',
          type: 'date',
          required: true,
          description: 'Data de inicio da ausencia',
        },
        {
          name: 'endDate',
          displayName: 'Data Fim',
          type: 'date',
          required: true,
          description: 'Data de fim da ausencia',
        },
        {
          name: 'status',
          displayName: 'Status',
          type: 'enum',
          required: false,
          description: 'Status da ausencia',
          enumValues: ['PENDING', 'APPROVED', 'REJECTED'],
          defaultValue: 'PENDING',
        },
      ],
      statusFlow: {
        statuses: ['PENDING', 'APPROVED', 'REJECTED'],
        transitions: {
          PENDING: ['APPROVED', 'REJECTED'],
        },
        initialStatus: 'PENDING',
        terminalStatuses: ['APPROVED', 'REJECTED'],
      },
      relationships: [
        {
          entity: 'Employee',
          type: 'belongs_to',
          description: 'Ausencia pertence a um funcionario',
          required: true,
        },
      ],
      validations: [
        'EmployeeId e obrigatorio',
        'Tipo e obrigatorio',
        'Datas de inicio e fim sao obrigatorias',
        'Data fim deve ser >= data inicio',
      ],
    },
    {
      name: 'Vacation',
      displayName: 'Ferias',
      description: 'Periodo de ferias de um funcionario com controle de saldo.',
      fields: [
        {
          name: 'employeeId',
          displayName: 'Funcionario',
          type: 'relation',
          required: true,
          description: 'Funcionario em ferias',
        },
        {
          name: 'startDate',
          displayName: 'Data Inicio',
          type: 'date',
          required: true,
          description: 'Data de inicio das ferias',
        },
        {
          name: 'endDate',
          displayName: 'Data Fim',
          type: 'date',
          required: true,
          description: 'Data de fim das ferias',
        },
        {
          name: 'days',
          displayName: 'Dias',
          type: 'number',
          required: true,
          description: 'Numero de dias de ferias',
        },
        {
          name: 'status',
          displayName: 'Status',
          type: 'enum',
          required: false,
          description: 'Status das ferias',
          enumValues: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
          defaultValue: 'SCHEDULED',
        },
      ],
      statusFlow: {
        statuses: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        transitions: {
          SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
          IN_PROGRESS: ['COMPLETED'],
        },
        initialStatus: 'SCHEDULED',
        terminalStatuses: ['COMPLETED', 'CANCELLED'],
      },
      relationships: [
        {
          entity: 'Employee',
          type: 'belongs_to',
          description: 'Ferias pertencem a um funcionario',
          required: true,
        },
      ],
      validations: [
        'EmployeeId e obrigatorio',
        'Datas de inicio e fim sao obrigatorias',
        'Funcionario precisa estar ACTIVE',
        'Nao pode sobrepor ferias existentes',
      ],
    },
  ],

  // ================================================================
  // WORKFLOWS
  // ================================================================
  workflows: [
    {
      name: 'hire_employee',
      displayName: 'Admissao de Funcionario',
      description: 'Fluxo completo para admitir um novo funcionario.',
      triggers: ['Novo funcionario contratado', 'Admissao'],
      outcomes: ['Funcionario registrado com departamento e cargo'],
      steps: [
        {
          order: 1,
          name: 'Verificar Departamento e Cargo',
          description: 'Garantir que departamento e cargo existem.',
          requiredData: ['departamento', 'cargo'],
          autoActions: ['hr_list_departments', 'hr_list_positions'],
          confirmActions: [],
          nextSteps: ['Registrar Funcionario'],
          errorHandling: 'Criar departamento/cargo se necessario',
        },
        {
          order: 2,
          name: 'Registrar Funcionario',
          description: 'Criar registro do funcionario.',
          requiredData: ['name', 'email', 'cpf', 'hireDate'],
          autoActions: [],
          confirmActions: ['hr_create_employee'],
          nextSteps: ['Atribuir Escala'],
          errorHandling: 'Informar erro (CPF duplicado, email invalido)',
        },
        {
          order: 3,
          name: 'Atribuir Escala',
          description: 'Vincular funcionario a uma escala de trabalho.',
          requiredData: ['employeeId', 'workScheduleId'],
          autoActions: ['hr_list_work_schedules'],
          confirmActions: [],
          nextSteps: [],
          errorHandling: 'Escala e opcional — pular se nao especificada',
        },
      ],
    },
    {
      name: 'request_vacation',
      displayName: 'Solicitar Ferias',
      description: 'Fluxo para registrar ferias de um funcionario.',
      triggers: ['Funcionario quer tirar ferias', 'Programar ferias'],
      outcomes: ['Ferias agendadas'],
      steps: [
        {
          order: 1,
          name: 'Verificar Saldo',
          description: 'Verificar se funcionario tem saldo de ferias.',
          requiredData: ['employeeId'],
          autoActions: ['hr_get_vacation_balance'],
          confirmActions: [],
          nextSteps: ['Agendar Ferias'],
          errorHandling: 'Informar saldo insuficiente',
        },
        {
          order: 2,
          name: 'Agendar Ferias',
          description: 'Criar registro de ferias.',
          requiredData: ['employeeId', 'startDate', 'endDate', 'days'],
          autoActions: [],
          confirmActions: ['hr_create_vacation'],
          nextSteps: [],
          errorHandling: 'Verificar sobreposicao com ferias existentes',
        },
      ],
    },
  ],

  // ================================================================
  // BUSINESS RULES
  // ================================================================
  rules: [
    {
      id: 'hr_001',
      description: 'CPF deve ser unico no tenant',
      severity: 'BLOCK',
      appliesTo: ['Employee', 'create'],
      condition: 'CPF ja existe para outro funcionario',
      action: 'Informar que CPF ja cadastrado e pedir verificacao',
    },
    {
      id: 'hr_002',
      description: 'Funcionario TERMINATED nao pode ser reativado',
      severity: 'BLOCK',
      appliesTo: ['Employee', 'modify'],
      condition: 'Status e TERMINATED',
      action: 'Informar que funcionario desligado nao pode ser reativado',
    },
    {
      id: 'hr_003',
      description: 'Ferias nao podem sobrepor periodos existentes',
      severity: 'BLOCK',
      appliesTo: ['Vacation', 'create'],
      condition: 'Periodo solicitado conflita com ferias existentes',
      action: 'Informar conflito e pedir novo periodo',
    },
    {
      id: 'hr_004',
      description: 'Salarios sao armazenados em centavos',
      severity: 'INFO',
      appliesTo: ['Employee', 'Position'],
      condition: 'Sempre',
      action: 'Converter reais para centavos. Exibir em reais para o usuario.',
    },
  ],

  // ================================================================
  // DECISION TREES
  // ================================================================
  decisionTrees: [
    {
      question: 'O que o usuario quer fazer com RH?',
      context: 'Quando usuario faz pedido generico sobre RH',
      branches: [
        {
          condition: 'Menciona admitir, contratar, novo funcionario',
          action: 'Iniciar workflow hire_employee',
        },
        {
          condition: 'Menciona ferias, descanso, folga programada',
          action: 'Iniciar workflow request_vacation',
        },
        {
          condition: 'Menciona falta, atestado, ausencia, licenca',
          action: 'Registrar ausencia',
        },
        {
          condition: 'Menciona demitir, desligar, rescindir',
          action: 'Alterar status para TERMINATED (requer confirmacao)',
        },
        {
          condition: 'Menciona listar, consultar, quantos funcionarios',
          action: 'Listar funcionarios com filtros',
        },
        {
          condition: 'Menciona escala, horario, turno',
          action: 'Consultar ou gerenciar escalas de trabalho',
        },
      ],
    },
  ],

  // ================================================================
  // DATA REQUIREMENTS
  // ================================================================
  dataRequirements: [
    {
      action: 'create_employee',
      required: [
        {
          field: 'name',
          description: 'Nome completo',
          howToObtain: 'ask_user',
        },
        {
          field: 'email',
          description: 'E-mail corporativo',
          howToObtain: 'ask_user',
        },
        {
          field: 'cpf',
          description: 'CPF do funcionario',
          howToObtain: 'ask_user',
        },
        {
          field: 'hireDate',
          description: 'Data de admissao',
          howToObtain: 'ask_user',
        },
      ],
      optional: [
        {
          field: 'departmentId',
          description: 'Departamento',
          howToObtain: 'lookup_entity',
        },
        {
          field: 'positionId',
          description: 'Cargo',
          howToObtain: 'lookup_entity',
        },
        {
          field: 'salary',
          description: 'Salario bruto',
          howToObtain: 'ask_user',
        },
        {
          field: 'workScheduleId',
          description: 'Escala de trabalho',
          howToObtain: 'lookup_entity',
        },
      ],
      derivable: [
        {
          field: 'hireDate',
          description: 'Data de admissao',
          derivationStrategy: 'Se nao informada, usar data atual como padrao',
        },
        {
          field: 'departmentId',
          description: 'Departamento',
          derivationStrategy:
            'Buscar por nome mencionado nos departamentos existentes',
        },
        {
          field: 'positionId',
          description: 'Cargo',
          derivationStrategy:
            'Buscar por nome mencionado nos cargos existentes',
        },
      ],
    },
  ],

  // ================================================================
  // DEPENDENCIES
  // ================================================================
  dependencies: [
    {
      module: 'finance',
      relationship: 'Folha de pagamento gera lancamentos financeiros',
      sharedEntities: ['Employee'],
    },
  ],

  // ================================================================
  // COMMON QUERIES
  // ================================================================
  commonQueries: [
    {
      intent: 'employee_list',
      examples: [
        'Quantos funcionarios tenho?',
        'Lista de funcionarios',
        'Quem trabalha no departamento X?',
      ],
      strategy: 'Listar funcionarios com filtros de status e departamento',
      toolsNeeded: ['hr_list_employees'],
    },
    {
      intent: 'absence_check',
      examples: [
        'Quem esta ausente hoje?',
        'Atestados do mes',
        'Funcionarios de licenca',
      ],
      strategy: 'Listar ausencias ativas no periodo',
      toolsNeeded: ['hr_list_absences'],
    },
    {
      intent: 'vacation_schedule',
      examples: [
        'Ferias programadas',
        'Quem esta de ferias?',
        'Calendario de ferias',
      ],
      strategy: 'Listar ferias agendadas ou em andamento',
      toolsNeeded: ['hr_list_vacations'],
    },
    {
      intent: 'department_info',
      examples: [
        'Quais departamentos existem?',
        'Estrutura organizacional',
        'Organograma',
      ],
      strategy: 'Listar departamentos com contagem de funcionarios',
      toolsNeeded: ['hr_list_departments'],
    },
  ],
};
