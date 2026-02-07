---
description: Visual standards and patterns for creating new SISMOG pages with consistent UI
---

# /ui-ux-pro-max - SISMOG Visual Standards

## 📐 Page Structure
```
1. PageHeader (title, subtitle, action buttons)
2. KPI Cards (3-column grid, optional)
3. Filter Bar (search + status + company tabs)
4. ResponsiveTable (with SkeletonLoader)
5. Loading Overlay
```

## 🛠️ Required Imports
```tsx
import { useState } from 'react';
import { use[Entity]s } from './hooks/use[Entity]s';
import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatusBadge from '../../components/StatusBadge';
import CompanyBadge from '../../components/CompanyBadge';
import { useModal } from '../../context/ModalContext';
import { Plus, Search } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import [Entity]Form from './components/[Entity]Form';
import [Entity]Details from './components/[Entity]Details';
```

## 🎨 Color Palette
| Type | Border | Badge BG/Text |
|------|--------|---------------|
| FEMOG | `border-blue-500` | `bg-blue-100 text-blue-800` |
| SEMOG | `border-orange-500` | `bg-purple-100 text-purple-800` |
| Success | `border-green-500` | `bg-green-100 text-green-800` |
| Warning | `border-yellow-500` | `bg-yellow-100 text-yellow-800` |
| Error | `border-red-500` | `bg-red-100 text-red-800` |

## 🔄 React Query Hook
```tsx
// hooks/use[Entity]s.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { [entity]Service } from '../../../services/[entity]Service';
import { queryKeys } from '../../../lib/queryClient';

export function use[Entity]s() {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: queryKeys.[entity]s.list(),
        queryFn: () => [entity]Service.get[Entity]s(),
    });
    const createMutation = useMutation({
        mutationFn: (data) => [entity]Service.create[Entity](data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.[entity]s.all }),
    });
    // updateMutation, deleteMutation similar pattern...
    return {
        [entity]s: query.data ?? [],
        isLoading: query.isLoading,
        refetch: query.refetch,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        delete: deleteMutation.mutateAsync,
    };
}
```

## 📦 Component Patterns

### PageHeader
```tsx
<PageHeader title="[Module]" subtitle="[Description]"
    action={<PrimaryButton onClick={handleCreate}><Plus size={20} className="mr-2"/>Novo</PrimaryButton>}
/>
```

### KPI Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="bg-white p-4 rounded-xl shadow-sm border border-[color]-100 flex items-center justify-between">
        <div>
            <p className="text-sm text-[color]-600 font-medium">[Label]</p>
            <p className="text-2xl font-bold text-gray-800">[Value]</p>
        </div>
        <div className="p-3 bg-[color]-50 text-[color]-600 rounded-lg"><[Icon] size={24}/></div>
    </div>
</div>
```

### Filter Bar
```tsx
<div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4">
    <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"/>
    </div>
    <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg bg-white">
        <option value="TODOS">Todos</option>
    </select>
</div>
```

### Company Tabs
```tsx
<div className="flex bg-white p-1 rounded-lg w-fit shadow-sm">
    {['TODOS','SEMOG','FEMOG'].map(tab=>(
        <button key={tab} onClick={()=>setCompanyFilter(tab)}
            className={`px-6 py-2 rounded-md text-sm font-medium ${
                companyFilter===tab ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'text-gray-500'
            }`}>{tab==='TODOS'?'Todas':tab}</button>
    ))}
</div>
```

### ResponsiveTable
```tsx
<ResponsiveTable data={filteredData} columns={columns} keyExtractor={i=>i.id}
    onRowClick={handleView} loading={isLoading} skeletonRows={5}
    getRowBorderColor={i=>i.empresa==='FEMOG'?'border-blue-500':'border-orange-500'}
    renderCard={i=>(<div className={`border-l-4 pl-3 ${i.empresa==='FEMOG'?'border-l-blue-500':'border-l-orange-500'}`}>
        {/* card content */}
    </div>)}
/>
```

## 🪟 Modal Patterns

### View Modal
```tsx
openViewModal('Detalhes', <[Entity]Details [entity]={item}/>, {
    canEdit: true, canDelete: true,
    onEdit: ()=>openFormModal('Editar', <[Entity]Form initialData={item} onSuccess={refetch}/>),
    onDelete: ()=>openConfirmModal('Excluir', 'Confirma?', async()=>{
        await delete[Entity](item.id);
        showFeedback('success', 'Excluído!');
    }),
});
```

### Details Component
```tsx
<div className="space-y-4">
    <div className="flex items-center justify-between border-b pb-4">
        <div><h3 className="text-lg font-bold text-gray-900">{entity.nome}</h3></div>
        <CompanyBadge company={entity.empresa}/>
    </div>
    <div className="grid grid-cols-2 gap-4">
        <div><p className="text-sm font-medium text-gray-500">[Label]</p><p className="text-gray-900">{value}</p></div>
    </div>
</div>
```

## 📝 Form Pattern
```tsx
const [Entity]Form = ({ initialData, onSuccess }) => {
    const { closeModal, showFeedback } = useModal();
    const { create, update, isCreating, isUpdating } = use[Entity]s();
    const [formData, setFormData] = useState({...});

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            initialData ? await update({id:initialData.id, data:formData}) : await create(formData);
            showFeedback('success', 'Salvo!'); onSuccess(); closeModal();
        } catch { showFeedback('error', 'Erro!'); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{/* inputs */}</div>
            <div className="flex justify-end pt-4 gap-3 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-md">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">Salvar</button>
            </div>
        </form>
    );
};
```

### Input Classes
```tsx
// Text: className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500"
// Select: same as text
// Checkbox: className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
```

## 🏷️ Badges
```tsx
<CompanyBadge company={item.empresa}/>  // FEMOG: blue, SEMOG: purple
<StatusBadge active={item.status==='ativo'} activeLabel="Ativo" inactiveLabel="Inativo"/>
<span className="px-2 py-1 text-xs rounded-full font-bold bg-[color]-100 text-[color]-800">{text}</span>
```

## 📏 Typography & Spacing
| Element | Classes |
|---------|---------|
| Page Title | `text-2xl font-bold text-gray-900` |
| Section Header | `text-sm font-semibold text-gray-900 mb-4 pb-1 border-b` |
| Label | `text-sm font-medium text-gray-700` |
| Currency | `font-bold text-green-700` |
| Page container | `space-y-6`, Card: `p-4`, Grid: `gap-4` |

## ✅ Checklist
- [ ] types.ts, hooks/use[Entity]s.ts, components/Form+Details, [Entity]s.tsx
- [ ] Query keys in queryClient.ts
- [ ] Use `isLoading` from hook, pass `loading={isLoading}` to table
- [ ] Route in routes.ts, App.tsx, Sidebar.tsx
