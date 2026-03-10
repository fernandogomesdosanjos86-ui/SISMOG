---
description: Criação de Novas Páginas - Workflow Completo
---

# /workflowspagina - Criação de Novas Páginas SISMOG

## 🌍 Infraestrutura e Padrões Globais

| Camada | Tecnologia | Regra |
|--------|-----------|-------|
| **Frontend** | React + TypeScript + Vite | Strict mode. Zero `any` exceto casts documentados |
| **Backend** | Supabase (BaaS, Projeto: `SISMOG`) | Toda lógica de dados via PostgREST/RPC |
| **Deploy** | Vercel | Build DEVE passar `tsc -b && vite build` com 0 erros |
| **Monitoramento** | Sentry (prod only) | DSN via `VITE_SENTRY_DSN` |
| **Cache** | React Query | staleTime dinâmico por tipo de dado |

> ⚠️ A Vercel **trava instantaneamente** se houver qualquer erro de TypeScript. SEMPRE rodar `npm run build` local antes de push.

---

## 📋 Pré-requisitos (Checklist Inicial)
- [ ] Nome da Feature definido (ex: `veiculos`)
- [ ] Tabela Supabase existente ou criada
- [ ] RLS policies aplicadas na tabela (obrigatório — ver Seção RLS)
- [ ] Types do Supabase atualizados em `src/types/database.ts`

---

## 🗂️ Estrutura de Arquivos

```
src/features/[module]/
├── types.ts                    # Interfaces + FormData types
├── hooks/use[Entity]s.ts       # React Query hook
├── services/[entity]Service.ts # (ou em src/services/ se compartilhado)
├── components/
│   ├── [Entity]Form.tsx        # Formulário (criar/editar)
│   └── [Entity]Details.tsx     # Visualização detalhada
└── [Entity]s.tsx               # Página principal
```

---

## 📝 Passos de Implementação

### 1. Tipos (`types.ts`)

```tsx
export interface [Entity] {
    id: string;
    empresa: 'SEMOG' | 'FEMOG';
    nome: string;
    status: 'ativo' | 'inativo';
    created_at: string;
    updated_at?: string;
}

export type [Entity]FormData = Omit<[Entity], 'id' | 'created_at' | 'updated_at'>;
```

---

### 2. Service (`services/[entity]Service.ts`)

> 🔒 **REGRA:** NUNCA usar `select('*')`. Sempre listar colunas explicitamente.  
> 🔒 **REGRA:** NUNCA usar tabela `con_usuarios`. O nome correto é `usuarios`.  
> 🔒 **REGRA:** SEMPRE usar casts `as any` no insert/update e `as unknown as T` no retorno.

```tsx
import { supabase } from '../../../services/supabase'; // Client tipado com Database
import type { [Entity] } from '../types';

export const [entity]Service = {
    async get[Entity]s() {
        const { data, error } = await supabase
            .from('[tabela]')
            .select('id, nome, empresa, status, created_at, updated_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as unknown as [Entity][];
    },

    async create[Entity](entity: [Entity]FormData) {
        const { data, error } = await supabase
            .from('[tabela]')
            .insert(entity as any)  // Cast: typed client requer campos exatos
            .select()
            .single();

        if (error) throw error;
        return data as unknown as [Entity];
    },

    async update[Entity](id: string, entity: Partial<[Entity]FormData>) {
        const { data, error } = await supabase
            .from('[tabela]')
            .update(entity as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as [Entity];
    },

    async delete[Entity](id: string) {
        const { error } = await supabase
            .from('[tabela]')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};
```

**Joins com colunas específicas:**
```tsx
.select(`
    id, nome, status, created_at,
    frota_veiculos!inner(marca_modelo, placa, tipo)
`)
```

---

### 3. Query Keys (`lib/queryClient.ts`)

> Todo novo módulo DEVE registrar query keys ANTES de criar hooks.

```tsx
// Adicionar em queryKeys:
[entity]s: {
    all: ['[entity]s'] as const,
    list: () => [...queryKeys.[entity]s.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.[entity]s.all, 'detail', id] as const,
},
```

**staleTime por volatilidade:**
```
STATIC   → 30min  (cargos, postos, veículos, equipamentos)
MODERATE → 5min   (funcionários, contratos, escalas) ← DEFAULT do QueryClient
DYNAMIC  → 2min   (apontamentos, faturamentos, recebimentos)
REALTIME → 30s    (chats)
```

---

### 4. Hook (`hooks/use[Entity]s.ts`)

> Padrão obrigatório: expor array (nunca undefined), loading, refetch, e todas as mutations.

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { [entity]Service } from '../services/[entity]Service';
import { queryKeys, STALE_TIMES } from '../../../lib/queryClient';

export function use[Entity]s() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.[entity]s.list(),
        queryFn: () => [entity]Service.get[Entity]s(),
        staleTime: STALE_TIMES.MODERATE,  // Ajustar conforme volatilidade
    });

    const createMutation = useMutation({
        mutationFn: (data: [Entity]FormData) => [entity]Service.create[Entity](data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.[entity]s.all }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<[Entity]FormData> }) =>
            [entity]Service.update[Entity](id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.[entity]s.all }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => [entity]Service.delete[Entity](id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.[entity]s.all }),
    });

    return {
        [entity]s: query.data ?? [],      // Array (NUNCA undefined)
        isLoading: query.isLoading,
        refetch: query.refetch,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        delete: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
```

---

### 5. Details (`components/[Entity]Details.tsx`)

> Padrão: Premium Card com header, grid de info, e timestamp.

```tsx
import { Info } from 'lucide-react';
import CompanyBadge from '../../../components/CompanyBadge';
import StatusBadge from '../../../components/StatusBadge';

interface [Entity]DetailsProps {
    [entity]: [Entity];
}

const [Entity]Details: React.FC<[Entity]DetailsProps> = ({ [entity] }) => (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-5">
            <div>
                <h3 className="text-xl font-bold text-gray-900">{[entity].nome}</h3>
                <p className="text-sm text-gray-500 mt-1">Subtítulo opcional</p>
            </div>
            <CompanyBadge company={[entity].empresa} />
        </div>

        {/* Info Grid (Premium Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <Info size={16} className="mr-2" /> Status
                </div>
                <div className="mt-1"><StatusBadge active={[entity].status === 'ativo'} /></div>
            </div>
            {/* Mais cards... */}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-400 pt-4 text-center">
            Registrado em {formatDate([entity].created_at)}
        </div>
    </div>
);
export default [Entity]Details;
```

---

### 6. Form (`components/[Entity]Form.tsx`)

> Usar componentes globais de input (NUNCA `<input>` ou `<select>` nativos).

```tsx
import { useState } from 'react';
import { useModal } from '../../../context/ModalContext';
import { use[Entity]s } from '../hooks/use[Entity]s';
import PrimaryButton from '../../../components/PrimaryButton';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';

interface [Entity]FormProps {
    initialData?: [Entity];
    onSuccess: () => void;
}

const [Entity]Form: React.FC<[Entity]FormProps> = ({ initialData, onSuccess }) => {
    const { closeModal, showFeedback } = useModal();
    const { create, update, isCreating, isUpdating } = use[Entity]s();
    const [formData, setFormData] = useState({
        nome: initialData?.nome || '',
        empresa: initialData?.empresa || 'FEMOG',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            initialData
                ? await update({ id: initialData.id, data: formData })
                : await create(formData);
            showFeedback('success', initialData ? 'Atualizado!' : 'Criado!');
            onSuccess();
            closeModal();
        } catch {
            showFeedback('error', 'Erro ao salvar. Tente novamente.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Nome" name="nome" value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})} required />
                <SelectField label="Empresa" name="empresa" value={formData.empresa}
                    onChange={e => setFormData({...formData, empresa: e.target.value})}
                    options={[{value: 'FEMOG', label: 'FEMOG'}, {value: 'SEMOG', label: 'SEMOG'}]} required />
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button type="button" onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Cancelar
                </button>
                <PrimaryButton type="submit" disabled={isCreating||isUpdating}>
                    {isCreating||isUpdating ? 'Salvando...' : 'Salvar'}
                </PrimaryButton>
            </div>
        </form>
    );
};
export default [Entity]Form;
```

---

### 7. Página Principal (`[Entity]s.tsx`)

> Ordem obrigatória: Header → KPIs → **FilterBar → Tabs** → Table → LoadingOverlay

```tsx
import { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import CompanyBadge from '../../components/CompanyBadge';
import { useModal } from '../../context/ModalContext';
import { Plus, Search } from 'lucide-react';
import { use[Entity]s } from './hooks/use[Entity]s';
import [Entity]Form from './components/[Entity]Form';
import [Entity]Details from './components/[Entity]Details';

const [Entity]s = () => {
    const { [entity]s, isLoading, refetch, delete: del } = use[Entity]s();
    const { openViewModal, openFormModal, openConfirmModal, showFeedback } = useModal();
    const [searchTerm, setSearchTerm] = useState('');
    const [companyFilter, setCompanyFilter] = useState('TODOS');

    const filteredData = [entity]s.filter(i =>
        (companyFilter==='TODOS'||i.empresa===companyFilter) &&
        i.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleView = (item: [Entity]) => openViewModal(
        'Detalhes do/da [Entidade]',
        <[Entity]Details [entity]={item}/>,
        {
            canEdit: true, canDelete: true,
            onEdit: () => openFormModal('Editar', <[Entity]Form initialData={item} onSuccess={refetch}/>),
            onDelete: () => openConfirmModal('Excluir', 'Confirma exclusão?', async () => {
                await del(item.id);
                showFeedback('success', 'Excluído com sucesso!');
            }),
        }
    );

    const columns = [
        { key: 'nome', header: 'Nome', render: (i: [Entity]) => i.nome },
        { key: 'empresa', header: 'Empresa', render: (i: [Entity]) => <CompanyBadge company={i.empresa}/> },
    ];

    return (
        <div className="space-y-4">
            <PageHeader title="[Entity]s" subtitle="Gerenciamento de [entidades]"
                action={<PrimaryButton onClick={() => openFormModal('Novo', <[Entity]Form onSuccess={refetch}/>)}>
                    <Plus size={20} className="mr-2"/>Novo
                </PrimaryButton>}
            />

            {/* 1. FILTER BAR — SEMPRE antes das tabs */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input type="text" placeholder="Buscar..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
            </div>

            {/* 2. TABS — SEMPRE depois dos filtros */}
            <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm overflow-x-auto">
                {['TODOS','SEMOG','FEMOG'].map(t => (
                    <button key={t} onClick={() => setCompanyFilter(t)}
                        className={`px-6 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                            companyFilter===t
                                ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}>
                        {t==='TODOS'?'Todas':t}
                    </button>
                ))}
            </div>

            <ResponsiveTable data={filteredData} columns={columns} keyExtractor={i => i.id}
                onRowClick={handleView} loading={isLoading} skeletonRows={5}
                getRowBorderColor={i => i.empresa==='FEMOG'?'border-blue-500':'border-orange-500'}
                renderCard={i => (
                    <div className={`border-l-4 pl-3 ${i.empresa==='FEMOG'?'border-l-blue-500':'border-l-orange-500'}`}>
                        <div className="font-bold">{i.nome}</div>
                    </div>
                )}
            />

            {isLoading && (
                <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/>
                </div>
            )}
        </div>
    );
};
export default [Entity]s;
```

---

## 🔗 Integração

### 8. Routes (`config/routes.ts`)
```tsx
[ENTITY]S: '/[entity]s',
```

### 9. App.tsx (Lazy Loading)
```tsx
const [Entity]s = lazy(() => import('./features/[module]/[Entity]s'));
<Route path={ROUTES.[ENTITY]S} element={<[Entity]s/>}/>
```

### 10. Sidebar (`components/sidebar/sidebarNavItems.ts`)
```tsx
{ path: ROUTES.[ENTITY]S, label: '[Entity]s', icon: [Icon] }
```

---

## 🔒 Segurança: RLS Obrigatória

> Toda tabela nova DEVE ter RLS antes do deploy. Consulte `standards-reference.md` para templates SQL completos.

```sql
-- Habilitar RLS
ALTER TABLE public.[tabela] ENABLE ROW LEVEL SECURITY;

-- Adm: acesso total
CREATE POLICY "adm_full_access" ON public.[tabela]
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.funcionarios f
            WHERE LOWER(f.email) = LOWER(auth.jwt() ->> 'email')
            AND LOWER(f.permissao) = 'adm')
);

-- Gestão: acesso total (ou restrito por setor se financeiro)
-- Operador: SELECT only (ou bloqueio total conforme módulo)
```

---

## ⚡ Performance Checklist

- [ ] staleTime definido no hook conforme volatilidade dos dados
- [ ] Colunas explícitas no `.select()` (NUNCA `*`)
- [ ] Rota lazy-loaded em `App.tsx`
- [ ] Skeleton loader na tabela (`loading={isLoading}`)
- [ ] Paginação server-side se tabela >500 registros (`.range(from, to)`)

---

## ✅ Checklist Final (ANTES do deploy)

| Item | Verificação |
|------|------------|
| `types.ts` criado | Interface + FormData |
| Query keys em `queryClient.ts` | Registradas |
| Service com colunas explícitas | Sem `select('*')` |
| Hook expõe mutations + loading | `isCreating`, `isUpdating` |
| `Details.tsx` (premium cards) | CompanyBadge + StatusBadge |
| `Form.tsx` (componentes globais) | InputField, SelectField |
| Página: FilterBar → Tabs → Table | Ordem correta |
| Mobile cards funcionam | `renderCard` com border-l-4 |
| RLS policies aplicadas | Testado com perfil Operador |
| `npm run build` local | **0 erros TypeScript** |
| Rota lazy + Sidebar | `routes.ts` + `App.tsx` + `sidebarNavItems.ts` |