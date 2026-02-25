---
description: Visual standards and patterns for creating new SISMOG pages with consistent UI
---

# /ui-ux-pro-max - SISMOG Visual Standards

## 📐 Page Structure
```
1. PageHeader (title, subtitle, action buttons)
2. KPI Cards (3-column grid, optional)
3. Filter Bar (search + dropdown filters. Deve vir PRECEDEDENDO as abas. Layout: `bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`)
4. Tabs (Company ou View tabs. Layout: `flex bg-white p-1 rounded-lg w-fit shadow-sm overflow-x-auto mb-4`)
5. ResponsiveTable (with SkeletonLoader)
6. Loading Overlay
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

### Filter Bar (Ordem: Sempre antes das abas)
```tsx
<div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
    <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
    </div>
    <div className="w-full md:w-auto">
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full">
            <option value="TODOS">Todos</option>
        </select>
    </div>
</div>
```

### Company/View Tabs (Ordem: Sempre depois dos filtros)
```tsx
<div className="flex bg-white p-1 rounded-lg w-fit shadow-sm overflow-x-auto mb-4">
    {['TODOS','SEMOG','FEMOG'].map(tab=>(
        <button key={tab} onClick={()=>setCompanyFilter(tab)}
            className={`px-6 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                companyFilter===tab ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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

### Details Component (Premium Card Pattern)
```tsx
import { Info } from 'lucide-react';
// ...
<div className="space-y-6">
    {/* Header / Main Info */}
    <div className="flex items-start justify-between border-b border-gray-100 pb-5">
        <div>
            <h3 className="text-xl font-bold text-gray-900">{entity.nome}</h3>
            <p className="text-sm text-gray-500 mt-1">Subtítulo</p>
        </div>
        <CompanyBadge company={entity.empresa} />
    </div>

    {/* Grid Infos (Premium Cards Pattern) */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
            <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                <Info size={16} className="mr-2" /> [Label]
            </div>
            <div className="text-gray-900 font-semibold text-lg">{value}</div>
            <div className="text-xs text-gray-500 font-mono">...</div>
        </div>
        
        {/* Highlight Card Example */}
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col gap-2">
            <div className="flex items-center text-blue-700 text-sm font-medium mb-1">
                <Info size={16} className="mr-2" /> [Highlight Label]
            </div>
            <div className="text-blue-900 font-semibold text-lg">{value}</div>
        </div>
    </div>

    {/* Footer Timestamp */}
    <div className="text-xs text-gray-400 pt-4 text-center">Registrado em date</div>
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
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Cancelar</button>
                <PrimaryButton type="submit" disabled={isCreating||isUpdating}>
                    {isCreating||isUpdating ? 'Salvando...' : 'Salvar'}
                </PrimaryButton>
            </div>
        </form>
    );
};
```

### Form Inputs (Global Components)
```tsx
import { InputField } from '../../components/forms/InputField';
import { SelectField } from '../../components/forms/SelectField';
import { MaskedInputField } from '../../components/forms/MaskedInputField';

// Use components instead of native html inputs for consistency
<InputField label="Nome" name="nome" value="..." onChange={...} required />
<SelectField label="Empresa" name="empresa" value="..." onChange={...} options={[{value: 'FEMOG', label: 'FEMOG'}, {value: 'SEMOG', label: 'SEMOG'}]} required />
<MaskedInputField label="CPF" mask="999.999.999-99" name="cpf" value="..." onChange={...} required />

// Checkbox (Native with classes):
// className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
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
