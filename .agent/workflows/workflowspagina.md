---
description: Criação de Novas Páginas - Workflow Completo
---

# /workflowspagina - Criação de Novas Páginas SISMOG

## 📋 Pré-requisitos
- [ ] Nome da Feature (ex: `veiculos`)
- [ ] Tabela Supabase existente com RLS
- [ ] Query keys em `src/lib/queryClient.ts`

## 🗂️ Estrutura
```
src/features/[module]/
├── types.ts
├── hooks/use[Entity]s.ts
├── components/
│   ├── [Entity]Form.tsx
│   └── [Entity]Details.tsx
└── [Entity]s.tsx
```

---

## 📝 Passos

### 1. Tipos (`types.ts`)
```tsx
export interface [Entity] {
    id: string;
    empresa: 'SEMOG' | 'FEMOG';
    status: 'ativo' | 'inativo';
    created_at: string;
}
```

### 2. Service (`services/[entity]Service.ts`)
```tsx
import { supabase } from './supabase';
import type { [Entity] } from '../features/[module]/types';

export const [entity]Service = {
    async get[Entity]s() {
        const { data, error } = await supabase.from('[tabela]').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data as [Entity][];
    },
    async create[Entity](data: Omit<[Entity], 'id'>) {
        const { data: result, error } = await supabase.from('[tabela]').insert(data).select().single();
        if (error) throw error;
        return result;
    },
    async update[Entity](id: string, data: Partial<[Entity]>) {
        const { data: result, error } = await supabase.from('[tabela]').update(data).eq('id', id).select().single();
        if (error) throw error;
        return result;
    },
    async delete[Entity](id: string) {
        const { error } = await supabase.from('[tabela]').delete().eq('id', id);
        if (error) throw error;
    },
};
```

### 3. Query Keys (`lib/queryClient.ts`)
```tsx
[entity]s: {
    all: ['[entity]s'] as const,
    list: () => [...queryKeys.[entity]s.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.[entity]s.all, 'detail', id] as const,
},
```

### 4. Hook (`hooks/use[Entity]s.ts`)
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { [entity]Service } from '../../../services/[entity]Service';
import { queryKeys } from '../../../lib/queryClient';

export function use[Entity]s() {
    const queryClient = useQueryClient();
    const query = useQuery({ queryKey: queryKeys.[entity]s.list(), queryFn: () => [entity]Service.get[Entity]s() });
    const createMutation = useMutation({
        mutationFn: (data) => [entity]Service.create[Entity](data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.[entity]s.all }),
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => [entity]Service.update[Entity](id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.[entity]s.all }),
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => [entity]Service.delete[Entity](id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.[entity]s.all }),
    });
    return {
        [entity]s: query.data ?? [], isLoading: query.isLoading, refetch: query.refetch,
        create: createMutation.mutateAsync, update: updateMutation.mutateAsync, delete: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending, isUpdating: updateMutation.isPending, isDeleting: deleteMutation.isPending,
    };
}
```

### 5. Details (`components/[Entity]Details.tsx`)
```tsx
import CompanyBadge from '../../../components/CompanyBadge';
import StatusBadge from '../../../components/StatusBadge';

const [Entity]Details = ({ [entity] }) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-lg font-bold text-gray-900">{[entity].nome}</h3>
            <CompanyBadge company={[entity].empresa}/>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm font-medium text-gray-500">Status</p><StatusBadge active={[entity].status==='ativo'}/></div>
        </div>
    </div>
);
export default [Entity]Details;
```

### 6. Form (`components/[Entity]Form.tsx`)
```tsx
import { useState } from 'react';
import { useModal } from '../../../context/ModalContext';
import { use[Entity]s } from '../hooks/use[Entity]s';

const [Entity]Form = ({ initialData, onSuccess }) => {
    const { closeModal, showFeedback } = useModal();
    const { create, update, isCreating, isUpdating } = use[Entity]s();
    const [formData, setFormData] = useState({ empresa: initialData?.empresa || 'FEMOG' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            initialData ? await update({ id: initialData.id, data: formData }) : await create(formData);
            showFeedback('success', 'Salvo!'); onSuccess(); closeModal();
        } catch { showFeedback('error', 'Erro!'); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{/* inputs */}</div>
            <div className="flex justify-end pt-4 gap-3 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-md">Cancelar</button>
                <button type="submit" disabled={isCreating||isUpdating} className="bg-blue-600 text-white px-4 py-2 rounded-md">
                    {isCreating||isUpdating ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </form>
    );
};
export default [Entity]Form;
```

### 7. Page (`[Entity]s.tsx`)
```tsx
import { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
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

    const handleView = (item) => openViewModal('Detalhes', <[Entity]Details [entity]={item}/>, {
        canEdit: true, canDelete: true,
        onEdit: () => openFormModal('Editar', <[Entity]Form initialData={item} onSuccess={refetch}/>),
        onDelete: () => openConfirmModal('Excluir', 'Confirma?', async () => { await del(item.id); showFeedback('success','Excluído!'); }),
    });

    const columns = [
        { key: 'nome', header: 'Nome', render: i => i.nome },
        { key: 'empresa', header: 'Empresa', render: i => <CompanyBadge company={i.empresa}/> },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="[Entity]s" subtitle="Gerenciamento"
                action={<PrimaryButton onClick={()=>openFormModal('Novo', <[Entity]Form onSuccess={refetch}/>)}><Plus size={20} className="mr-2"/>Novo</PrimaryButton>}
            />
            <div className="bg-white p-4 rounded-xl shadow-sm flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"/>
                </div>
            </div>
            <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm">
                {['TODOS','SEMOG','FEMOG'].map(t=>(
                    <button key={t} onClick={()=>setCompanyFilter(t)}
                        className={`px-6 py-2 rounded-md text-sm ${companyFilter===t?'bg-blue-50 text-blue-700':'text-gray-500'}`}>
                        {t==='TODOS'?'Todas':t}
                    </button>
                ))}
            </div>
            <ResponsiveTable data={filteredData} columns={columns} keyExtractor={i=>i.id}
                onRowClick={handleView} loading={isLoading} skeletonRows={5}
                getRowBorderColor={i=>i.empresa==='FEMOG'?'border-blue-500':'border-orange-500'}
                renderCard={i=>(<div className={`border-l-4 pl-3 ${i.empresa==='FEMOG'?'border-l-blue-500':'border-l-orange-500'}`}>
                    <div className="font-bold">{i.nome}</div>
                </div>)}
            />
            {isLoading && <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/>
            </div>}
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

### 9. App.tsx
```tsx
const [Entity]s = lazy(() => import('./features/[module]/[Entity]s'));
<Route path={ROUTES.[ENTITY]S} element={<[Entity]s/>}/>
```

### 10. Sidebar
```tsx
{ path: ROUTES.[ENTITY]S, label: '[Entity]s', icon: [Icon] }
```

---

## ✅ Checklist
| Item | OK? |
|------|-----|
| Header com botão Novo | |
| Table renderiza dados | |
| Mobile cards funcionam | |
| Filtros Search/Company | |
| Skeleton durante loading | |
| View modal com detalhes | |
| Edit/Delete funcionam | |
| Form valida e salva | |
| Cache atualiza após CRUD | |