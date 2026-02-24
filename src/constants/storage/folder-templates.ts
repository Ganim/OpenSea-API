export interface SystemFolderTemplate {
  name: string;
  icon: string;
  module?: string;
  children?: SystemFolderTemplate[];
}

export interface EntityFolderConfig {
  module: string;
  entityType: string;
  basePath: string;
  subfolders: string[];
}

export interface FilterFolderConfig {
  path: string;
  name: string;
  module: string;
  filterFileType: string;
}

export const ROOT_SYSTEM_FOLDERS: SystemFolderTemplate[] = [
  {
    name: 'Recursos Humanos',
    icon: 'users',
    module: 'hr',
    children: [{ name: 'Funcionários', icon: 'user' }],
  },
  {
    name: 'Financeiro',
    icon: 'wallet',
    module: 'finance',
    children: [
      { name: 'Empresas', icon: 'building-2' },
      { name: 'Outros', icon: 'folder' },
    ],
  },
  {
    name: 'Estoque',
    icon: 'package',
    module: 'stock',
    children: [{ name: 'Fabricantes', icon: 'factory' }],
  },
  { name: 'Usuários', icon: 'user-circle', module: 'core' },
];

export const ENTITY_FOLDER_CONFIGS: EntityFolderConfig[] = [
  {
    module: 'hr',
    entityType: 'employee',
    basePath: '/recursos-humanos/funcionarios',
    subfolders: ['Atestados', 'Documentos Pessoais', 'Fichas de Treinamento'],
  },
  {
    module: 'core',
    entityType: 'user',
    basePath: '/usuarios',
    subfolders: ['Anexos'],
  },
  {
    module: 'finance',
    entityType: 'company',
    basePath: '/financeiro/empresas',
    subfolders: [
      'Centro de Custo',
      'Contas Bancárias',
      'Certificados Digitais',
      'Documentos Empresariais',
    ],
  },
  {
    module: 'stock',
    entityType: 'manufacturer',
    basePath: '/estoque/fabricantes',
    subfolders: [],
  },
];

export const FILTER_FOLDER_CONFIGS: FilterFolderConfig[] = [
  {
    path: '/recursos-humanos/atestados',
    name: 'Atestados (Todos)',
    module: 'hr',
    filterFileType: 'ATESTADO',
  },
  {
    path: '/recursos-humanos/documentos-pessoais',
    name: 'Documentos Pessoais (Todos)',
    module: 'hr',
    filterFileType: 'DOCUMENTO_PESSOAL',
  },
  {
    path: '/estoque/notas-fiscais',
    name: 'Notas Fiscais (Todas)',
    module: 'stock',
    filterFileType: 'NFE',
  },
  {
    path: '/financeiro/boletos',
    name: 'Boletos (Todos)',
    module: 'finance',
    filterFileType: 'BOLETO',
  },
  {
    path: '/financeiro/comprovantes',
    name: 'Comprovantes (Todos)',
    module: 'finance',
    filterFileType: 'COMPROVANTE',
  },
];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
