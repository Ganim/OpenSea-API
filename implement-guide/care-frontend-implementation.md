# Guia de Implementação Frontend - Sistema de Care (Instruções de Cuidado)

## Visão Geral

O sistema de Care segue o padrão **ISO 3758** para etiquetas de cuidado têxtil. Permite associar instruções de cuidado a produtos, com ícones SVG padronizados e labels em português.

---

## 1. Endpoints da API

### 1.1 Listar Opções de Care

```http
GET /v1/care/options
Authorization: Bearer {token}
```

**Permission Necessária:** `stock.care.read`

**Response (200):**
```json
{
  "options": {
    "WASH": [
      {
        "id": "WASH_30",
        "code": "WASH_30",
        "category": "WASH",
        "assetPath": "iso3758/WASH_30.svg",
        "label": "Lavar a 30°C"
      }
    ],
    "BLEACH": [...],
    "DRY": [...],
    "IRON": [...],
    "PROFESSIONAL": [...]
  }
}
```

### 1.2 Definir Care do Produto

```http
PUT /v1/products/:productId/care
Authorization: Bearer {token}
Content-Type: application/json
```

**Permission Necessária:** `stock.products.update`

**Request Body:**
```json
{
  "careInstructionIds": ["WASH_30", "DO_NOT_BLEACH", "IRON_150"]
}
```

**Response (200):**
```json
{
  "careInstructionIds": ["WASH_30", "DO_NOT_BLEACH", "IRON_150"],
  "careInstructions": [
    {
      "id": "WASH_30",
      "code": "WASH_30",
      "category": "WASH",
      "assetPath": "iso3758/WASH_30.svg",
      "label": "Lavar a 30°C"
    },
    {
      "id": "DO_NOT_BLEACH",
      "code": "DO_NOT_BLEACH",
      "category": "BLEACH",
      "assetPath": "iso3758/DO_NOT_BLEACH.svg",
      "label": "Não usar alvejante"
    },
    {
      "id": "IRON_150",
      "code": "IRON_150",
      "category": "IRON",
      "assetPath": "iso3758/IRON_150.svg",
      "label": "Passar ferro a 150°C"
    }
  ]
}
```

---

## 2. Catálogo Completo de Care Instructions

### 2.1 WASH (Lavagem) - 10 opções

| Código | Label (PT-BR) | Descrição |
|--------|---------------|-----------|
| `DO_NOT_WASH` | Não lavar | Proibido lavar |
| `WASH_HAND` | Lavar à mão | Lavagem manual apenas |
| `WASH_VERY_GENTLE` | Lavagem muito delicada | Ciclo muito suave |
| `WASH_GENTLE` | Lavagem delicada | Ciclo suave |
| `WASH_NORMAL` | Lavagem normal | Ciclo normal |
| `WASH_30` | Lavar a 30°C | Temperatura máxima 30°C |
| `WASH_40` | Lavar a 40°C | Temperatura máxima 40°C |
| `WASH_50` | Lavar a 50°C | Temperatura máxima 50°C |
| `WASH_60` | Lavar a 60°C | Temperatura máxima 60°C |
| `WASH_70` | Lavar a 70°C | Temperatura máxima 70°C |
| `WASH_95` | Lavar a 95°C | Temperatura máxima 95°C |

### 2.2 BLEACH (Alvejante) - 3 opções

| Código | Label (PT-BR) | Descrição |
|--------|---------------|-----------|
| `BLEACH_ALLOWED` | Alvejante permitido | Qualquer alvejante |
| `BLEACH_NON_CHLORINE` | Apenas alvejante sem cloro | Sem cloro |
| `DO_NOT_BLEACH` | Não usar alvejante | Proibido alvejante |

### 2.3 DRY (Secagem) - 10 opções

| Código | Label (PT-BR) | Descrição |
|--------|---------------|-----------|
| `DO_NOT_TUMBLE_DRY` | Não secar em tambor | Proibido secadora |
| `TUMBLE_DRY_LOW` | Secar em tambor baixo | Temperatura baixa |
| `TUMBLE_DRY_MEDIUM` | Secar em tambor médio | Temperatura média |
| `TUMBLE_DRY_HIGH` | Secar em tambor alto | Temperatura alta |
| `TUMBLE_DRY_NORMAL` | Secar em tambor normal | Normal |
| `DRY_LINE` | Secar no varal | Pendurado |
| `DRY_LINE_SHADE` | Secar no varal à sombra | Pendurado sem sol |
| `DRY_FLAT` | Secar na horizontal | Deitado |
| `DRY_FLAT_SHADE` | Secar na horizontal à sombra | Deitado sem sol |
| `DRY_DRIP` | Secar gotejando | Sem torcer |
| `DRY_DRIP_SHADE` | Secar gotejando à sombra | Sem torcer, sem sol |

### 2.4 IRON (Passar Ferro) - 6 opções

| Código | Label (PT-BR) | Descrição |
|--------|---------------|-----------|
| `DO_NOT_IRON` | Não passar ferro | Proibido |
| `IRON_ALLOWED` | Pode passar ferro | Permitido |
| `IRON_NO_STEAM` | Passar ferro sem vapor | Sem vapor |
| `IRON_110` | Passar ferro a 110°C | Temperatura baixa (sintético) |
| `IRON_150` | Passar ferro a 150°C | Temperatura média (lã/seda) |
| `IRON_200` | Passar ferro a 200°C | Temperatura alta (algodão/linho) |

### 2.5 PROFESSIONAL (Limpeza Profissional) - 14 opções

| Código | Label (PT-BR) | Descrição |
|--------|---------------|-----------|
| `DO_NOT_DRYCLEAN` | Não lavar a seco | Proibido lavagem a seco |
| `DRYCLEAN_ANY` | Lavar a seco com qualquer solvente | Qualquer solvente |
| `DRYCLEAN_P` | Lavar a seco com percloroetileno | Solvente P |
| `DRYCLEAN_P_GENTLE` | Lavar a seco suave com percloroetileno | Solvente P, suave |
| `DRYCLEAN_P_VERY_GENTLE` | Lavar a seco muito suave com percloroetileno | Solvente P, muito suave |
| `DRYCLEAN_F` | Lavar a seco com hidrocarboneto | Solvente F |
| `DRYCLEAN_F_GENTLE` | Lavar a seco suave com hidrocarboneto | Solvente F, suave |
| `DRYCLEAN_F_VERY_GENTLE` | Lavar a seco muito suave com hidrocarboneto | Solvente F, muito suave |
| `DO_NOT_WETCLEAN` | Não lavar a úmido profissional | Proibido wetclean |
| `WETCLEAN_W` | Lavagem a úmido profissional | Wetclean normal |
| `WETCLEAN_W_GENTLE` | Lavagem a úmido suave | Wetclean suave |
| `WETCLEAN_W_VERY_GENTLE` | Lavagem a úmido muito suave | Wetclean muito suave |

---

## 3. Restrições e Validações

### 3.1 Regras de Negócio

| Regra | Valor | Erro Retornado |
|-------|-------|----------------|
| Máximo de itens | 20 | `400 Bad Request` |
| Duplicatas | Não permitido | `400 Bad Request: "Duplicate care instruction IDs are not allowed"` |
| IDs inválidos | Devem existir no catálogo | `400 Bad Request: "Invalid care instruction IDs: [ids]"` |
| Produto inexistente | Deve existir | `404 Not Found: "Product not found"` |

### 3.2 Validação no Frontend

```typescript
// Validações recomendadas antes de enviar
const MAX_CARE_INSTRUCTIONS = 20;

function validateCareInstructions(ids: string[], catalog: CareOption[]): ValidationResult {
  const errors: string[] = [];

  // 1. Verificar limite máximo
  if (ids.length > MAX_CARE_INSTRUCTIONS) {
    errors.push(`Máximo de ${MAX_CARE_INSTRUCTIONS} instruções permitidas`);
  }

  // 2. Verificar duplicatas
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== ids.length) {
    errors.push('Instruções duplicadas não são permitidas');
  }

  // 3. Verificar IDs válidos
  const validCodes = new Set(catalog.map(c => c.code));
  const invalidIds = ids.filter(id => !validCodes.has(id));
  if (invalidIds.length > 0) {
    errors.push(`Códigos inválidos: ${invalidIds.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 4. Permissões (RBAC)

### 4.1 Códigos de Permissão

```typescript
// Permissões relacionadas ao Care
const CARE_PERMISSIONS = {
  // Para listar catálogo de opções
  READ_CATALOG: 'stock.care.read',

  // Para definir care do produto (usa permissão de produto)
  SET_PRODUCT_CARE: 'stock.products.update'
};
```

### 4.2 Verificação no Frontend

```typescript
// Hook para verificar permissões
function useCarePermissions() {
  const { permissions } = useAuth();

  return {
    canViewCatalog: permissions.includes('stock.care.read'),
    canSetProductCare: permissions.includes('stock.products.update'),
  };
}

// Uso no componente
function ProductCareSection({ productId }) {
  const { canViewCatalog, canSetProductCare } = useCarePermissions();

  if (!canViewCatalog) {
    return <NoPermissionMessage />;
  }

  return (
    <CareSelector
      productId={productId}
      readOnly={!canSetProductCare}
    />
  );
}
```

---

## 5. Tipos TypeScript

```typescript
// Categorias de Care
type CareCategory = 'WASH' | 'BLEACH' | 'DRY' | 'IRON' | 'PROFESSIONAL';

// Opção de Care
interface CareOption {
  id: string;
  code: string;
  category: CareCategory;
  assetPath: string;
  label: string;
}

// Response do endpoint de listagem
interface CareOptionsResponse {
  options: {
    WASH: CareOption[];
    BLEACH: CareOption[];
    DRY: CareOption[];
    IRON: CareOption[];
    PROFESSIONAL: CareOption[];
  };
}

// Request para definir care do produto
interface SetProductCareRequest {
  careInstructionIds: string[];
}

// Response após definir care
interface SetProductCareResponse {
  careInstructionIds: string[];
  careInstructions: CareOption[];
}

// Produto com care instructions
interface Product {
  id: string;
  name: string;
  // ... outros campos
  careInstructionIds: string[];
}

// Metadados das categorias para UI
interface CategoryMeta {
  key: CareCategory;
  label: string;
  icon: string;
  description: string;
}

const CATEGORY_META: CategoryMeta[] = [
  {
    key: 'WASH',
    label: 'Lavagem',
    icon: 'droplet',
    description: 'Instruções de lavagem à máquina ou à mão'
  },
  {
    key: 'BLEACH',
    label: 'Alvejante',
    icon: 'flask',
    description: 'Uso de alvejantes e branqueadores'
  },
  {
    key: 'DRY',
    label: 'Secagem',
    icon: 'wind',
    description: 'Métodos de secagem recomendados'
  },
  {
    key: 'IRON',
    label: 'Passar Ferro',
    icon: 'thermometer',
    description: 'Temperaturas e restrições de ferro'
  },
  {
    key: 'PROFESSIONAL',
    label: 'Limpeza Profissional',
    icon: 'briefcase',
    description: 'Lavagem a seco e limpeza especializada'
  }
];
```

---

## 6. Implementação do Componente Visual

### 6.1 Estrutura de Componentes

```
components/
└── care/
    ├── CareSelector.tsx          # Componente principal
    ├── CareCategorySection.tsx   # Seção de categoria
    ├── CareOptionCard.tsx        # Card de opção individual
    ├── CareIcon.tsx              # Componente de ícone SVG
    ├── SelectedCareList.tsx      # Lista de selecionados
    └── hooks/
        ├── useCareOptions.ts     # Hook para buscar opções
        └── useProductCare.ts     # Hook para gerenciar care do produto
```

### 6.2 Hook para Buscar Opções

```typescript
// hooks/useCareOptions.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCareOptions() {
  return useQuery({
    queryKey: ['care-options'],
    queryFn: async () => {
      const response = await api.get<CareOptionsResponse>('/v1/care/options');
      return response.data.options;
    },
    staleTime: Infinity, // Catálogo não muda frequentemente
  });
}
```

### 6.3 Hook para Gerenciar Care do Produto

```typescript
// hooks/useProductCare.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useProductCare(productId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (careInstructionIds: string[]) => {
      const response = await api.put<SetProductCareResponse>(
        `/v1/products/${productId}/care`,
        { careInstructionIds }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidar cache do produto
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });

  return mutation;
}
```

### 6.4 Componente de Ícone SVG

```tsx
// components/care/CareIcon.tsx
interface CareIconProps {
  assetPath: string;
  size?: number;
  className?: string;
}

export function CareIcon({ assetPath, size = 48, className }: CareIconProps) {
  // URL base dos assets (configurar conforme ambiente)
  const baseUrl = process.env.NEXT_PUBLIC_ASSETS_URL || '/assets';

  return (
    <img
      src={`${baseUrl}/${assetPath}`}
      alt=""
      width={size}
      height={size}
      className={className}
      loading="lazy"
    />
  );
}
```

### 6.5 Card de Opção Individual

```tsx
// components/care/CareOptionCard.tsx
interface CareOptionCardProps {
  option: CareOption;
  selected: boolean;
  disabled?: boolean;
  onToggle: (code: string) => void;
}

export function CareOptionCard({
  option,
  selected,
  disabled,
  onToggle
}: CareOptionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(option.code)}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
        'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-gray-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <CareIcon
        assetPath={option.assetPath}
        size={48}
        className={selected ? '' : 'grayscale opacity-60'}
      />
      <span className="text-xs text-center font-medium text-gray-700">
        {option.label}
      </span>
    </button>
  );
}
```

### 6.6 Seção de Categoria

```tsx
// components/care/CareCategorySection.tsx
interface CareCategorySectionProps {
  category: CareCategory;
  options: CareOption[];
  selectedIds: string[];
  disabled?: boolean;
  onToggle: (code: string) => void;
}

export function CareCategorySection({
  category,
  options,
  selectedIds,
  disabled,
  onToggle,
}: CareCategorySectionProps) {
  const meta = CATEGORY_META.find(c => c.key === category)!;
  const selectedCount = options.filter(o => selectedIds.includes(o.code)).length;

  return (
    <div className="space-y-4">
      {/* Header da Categoria */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Icon name={meta.icon} className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{meta.label}</h3>
            <p className="text-sm text-gray-500">{meta.description}</p>
          </div>
        </div>
        {selectedCount > 0 && (
          <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Grid de Opções */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {options.map(option => (
          <CareOptionCard
            key={option.code}
            option={option}
            selected={selectedIds.includes(option.code)}
            disabled={disabled}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
```

### 6.7 Componente Principal

```tsx
// components/care/CareSelector.tsx
interface CareSelectorProps {
  productId: string;
  initialSelectedIds?: string[];
  readOnly?: boolean;
  onSave?: (ids: string[]) => void;
}

export function CareSelector({
  productId,
  initialSelectedIds = [],
  readOnly = false,
  onSave,
}: CareSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const { data: options, isLoading, error } = useCareOptions();
  const mutation = useProductCare(productId);

  const hasChanges = JSON.stringify(selectedIds.sort()) !==
                     JSON.stringify(initialSelectedIds.sort());

  const handleToggle = (code: string) => {
    if (readOnly) return;

    setSelectedIds(prev => {
      if (prev.includes(code)) {
        return prev.filter(id => id !== code);
      }
      // Verificar limite
      if (prev.length >= 20) {
        toast.error('Máximo de 20 instruções permitidas');
        return prev;
      }
      return [...prev, code];
    });
  };

  const handleSave = async () => {
    try {
      await mutation.mutateAsync(selectedIds);
      toast.success('Instruções de cuidado atualizadas');
      onSave?.(selectedIds);
    } catch (error) {
      toast.error('Erro ao salvar instruções');
    }
  };

  const handleClear = () => {
    setSelectedIds([]);
  };

  if (isLoading) {
    return <CareSkeletonLoader />;
  }

  if (error) {
    return <ErrorMessage message="Erro ao carregar opções de cuidado" />;
  }

  const categories: CareCategory[] = ['WASH', 'BLEACH', 'DRY', 'IRON', 'PROFESSIONAL'];

  return (
    <div className="space-y-8">
      {/* Header com contador e ações */}
      <div className="flex items-center justify-between sticky top-0 bg-white py-4 z-10 border-b">
        <div>
          <h2 className="text-lg font-semibold">Instruções de Cuidado</h2>
          <p className="text-sm text-gray-500">
            {selectedIds.length}/20 instruções selecionadas
          </p>
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={selectedIds.length === 0}
            >
              Limpar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || mutation.isPending}
              loading={mutation.isPending}
            >
              Salvar
            </Button>
          </div>
        )}
      </div>

      {/* Lista de selecionados (preview) */}
      {selectedIds.length > 0 && (
        <SelectedCareList
          options={options}
          selectedIds={selectedIds}
          onRemove={readOnly ? undefined : handleToggle}
        />
      )}

      {/* Categorias */}
      <div className="space-y-8">
        {categories.map(category => (
          <CareCategorySection
            key={category}
            category={category}
            options={options[category]}
            selectedIds={selectedIds}
            disabled={readOnly}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}
```

### 6.8 Lista de Selecionados (Preview)

```tsx
// components/care/SelectedCareList.tsx
interface SelectedCareListProps {
  options: CareOptionsResponse['options'];
  selectedIds: string[];
  onRemove?: (code: string) => void;
}

export function SelectedCareList({
  options,
  selectedIds,
  onRemove
}: SelectedCareListProps) {
  // Flatten todas as opções para busca
  const allOptions = Object.values(options).flat();
  const selectedOptions = selectedIds
    .map(id => allOptions.find(o => o.code === id))
    .filter(Boolean) as CareOption[];

  // Agrupar por categoria para exibição
  const grouped = selectedOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<CareCategory, CareOption[]>);

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Instruções Selecionadas
      </h4>
      <div className="flex flex-wrap gap-2">
        {selectedOptions.map(option => (
          <div
            key={option.code}
            className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border shadow-sm"
          >
            <CareIcon assetPath={option.assetPath} size={20} />
            <span className="text-sm">{option.label}</span>
            {onRemove && (
              <button
                onClick={() => onRemove(option.code)}
                className="ml-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 7. Fluxo de Implementação

### 7.1 Fluxo de Listagem

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  GET /v1/care/   │────▶│    Backend      │
│   Component     │     │     options      │     │    API          │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                               ┌──────────────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │ CareCatalog     │
                        │ Provider        │
                        │ (Singleton)     │
                        └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │ manifest.json   │
                        │ + CARE_LABELS   │
                        └─────────────────┘
```

### 7.2 Fluxo de Salvamento

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Select   │────▶│ PUT /v1/products │────▶│   Validation    │
│   Care Options  │     │  /:id/care       │     │   Layer         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                        ┌─────────────────────────────────┤
                        │                                 │
                        ▼                                 ▼
                ┌───────────────┐               ┌─────────────────┐
                │ Check Max 20  │               │ Validate IDs    │
                │ items         │               │ Against Catalog │
                └───────────────┘               └─────────────────┘
                                                          │
                                                          ▼
                                               ┌─────────────────┐
                                               │ Update Product  │
                                               │ in Database     │
                                               └─────────────────┘
                                                          │
                                                          ▼
                                               ┌─────────────────┐
                                               │ Audit Log       │
                                               │ Created         │
                                               └─────────────────┘
```

---

## 8. Tratamento de Erros

```typescript
// Mapeamento de erros da API
const CARE_ERROR_MESSAGES: Record<string, string> = {
  'Duplicate care instruction IDs are not allowed':
    'Não é permitido selecionar a mesma instrução duas vezes',
  'Invalid care instruction IDs':
    'Uma ou mais instruções selecionadas são inválidas',
  'Product not found':
    'Produto não encontrado',
  'Unauthorized':
    'Você não tem permissão para esta ação',
  'Forbidden':
    'Acesso negado - verifique suas permissões',
};

function handleCareError(error: AxiosError) {
  const message = error.response?.data?.message || error.message;

  // Buscar mensagem amigável
  for (const [key, value] of Object.entries(CARE_ERROR_MESSAGES)) {
    if (message.includes(key)) {
      return value;
    }
  }

  return 'Erro ao processar instruções de cuidado';
}
```

---

## 9. Considerações de UX

### 9.1 Estados Visuais

- **Não selecionado:** Ícone em escala de cinza com opacidade reduzida
- **Selecionado:** Ícone colorido com borda destacada
- **Hover:** Fundo levemente colorido
- **Disabled:** Opacidade 50%, cursor not-allowed
- **Loading:** Skeleton loader mantendo layout

### 9.2 Feedback Visual

- Toast de sucesso ao salvar
- Toast de erro com mensagem clara
- Indicador de "alterações não salvas"
- Contador de selecionados (X/20)
- Badge na categoria mostrando quantos estão selecionados

### 9.3 Acessibilidade

- Todos os botões com `aria-label` descritivo
- Ícones com `alt` vazio (decorativos) mas labels visíveis
- Navegação por teclado funcional
- Contraste adequado nos estados

---

## 10. Assets e Ícones SVG

Os ícones SVG estão localizados em:
```
/assets/care/iso3758/*.svg
```

### 10.1 Servindo os Assets

**Opção 1: CDN/Storage**
```typescript
const ASSETS_BASE_URL = 'https://cdn.example.com/assets';
```

**Opção 2: API Proxy**
```typescript
// Backend serve os assets
const ASSETS_BASE_URL = '/api/assets';
```

**Opção 3: Build-time Import**
```typescript
// Importar SVGs como componentes React
import WashIcon from '@/assets/care/iso3758/WASH_30.svg';
```

### 10.2 Cache de Assets

Configurar headers HTTP para cache longo:
```http
Cache-Control: public, max-age=31536000, immutable
```

---

## 11. Exemplo Completo de Uso

```tsx
// pages/products/[id]/care.tsx
import { CareSelector } from '@/components/care/CareSelector';
import { useProduct } from '@/hooks/useProduct';

export default function ProductCarePage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id);
  const { canSetProductCare } = useCarePermissions();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!product) {
    return <NotFound />;
  }

  return (
    <PageLayout>
      <PageHeader
        title={`Instruções de Cuidado - ${product.name}`}
        breadcrumbs={[
          { label: 'Produtos', href: '/products' },
          { label: product.name, href: `/products/${id}` },
          { label: 'Cuidados' },
        ]}
      />

      <PageContent>
        <CareSelector
          productId={id}
          initialSelectedIds={product.careInstructionIds}
          readOnly={!canSetProductCare}
        />
      </PageContent>
    </PageLayout>
  );
}
```

---

## 12. Checklist de Implementação

- [ ] Configurar URL base dos assets SVG
- [ ] Implementar hook `useCareOptions`
- [ ] Implementar hook `useProductCare`
- [ ] Criar componente `CareIcon`
- [ ] Criar componente `CareOptionCard`
- [ ] Criar componente `CareCategorySection`
- [ ] Criar componente `CareSelector`
- [ ] Criar componente `SelectedCareList`
- [ ] Implementar validações client-side
- [ ] Implementar tratamento de erros
- [ ] Adicionar verificação de permissões
- [ ] Testar fluxo completo
- [ ] Verificar acessibilidade
- [ ] Otimizar performance (lazy loading de ícones)
