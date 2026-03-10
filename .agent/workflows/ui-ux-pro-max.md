---
description: Visual standards and patterns for creating new SISMOG pages with consistent UI
---

# /ui-ux-pro-max — Padrões Visuais e UX SISMOG

> Consulte `workflowspagina.md` para o workflow completo de criação de páginas.
> Consulte `standards.md` / `standards-reference.md` para regras de arquitetura e segurança.

---

## 🌍 Infraestrutura

| Camada | Tecnologia | Regra |
|--------|-----------|-------|
| **Backend** | Supabase (`SISMOG`) | Client tipado: `createClient<Database>()` |
| **Deploy** | Vercel | Build `tsc -b && vite build` com 0 erros |
| **Cache** | React Query | staleTime dinâmico (STATIC 30m / MODERATE 5m / DYNAMIC 2m / REALTIME 30s) |
| **Monitoramento** | Sentry (prod only) | ErrorBoundary + `captureException` |

---

## 📐 Hierarquia Visual da Página (Ordem Obrigatória)

```
1. PageHeader (título + botão ação)
2. KPI Cards (grid 3 colunas, opcional)
3. Filter Bar (search + dropdown)         ← SEMPRE ANTES das tabs
4. Company/View Tabs                       ← SEMPRE DEPOIS dos filtros
5. ResponsiveTable (skeleton + cards mobile)
6. Loading Overlay (condicional)
```

---

## 🧩 Componentes Obrigatórios

> ❌ É **PROIBIDO** usar `<span>`, `<input>`, `<select>`, `<button>` ou `<table>` nativos onde existir componente global.

| Necessidade | Componente | Importação |
|------------|-----------|-----------|
| Badge empresa | `<CompanyBadge>` | `../../components/CompanyBadge` |
| Status ativo/inativo | `<StatusBadge>` | `../../components/StatusBadge` |
| Tabela (desktop + mobile) | `<ResponsiveTable>` | `../../components/ResponsiveTable` |
| Input texto | `<InputField>` | `../../components/forms/InputField` |
| Select | `<SelectField>` | `../../components/forms/SelectField` |
| CPF/CNPJ/Telefone | `<MaskedInputField>` | `../../components/forms/MaskedInputField` |
| Moeda | `<CurrencyInput>` | `../../components/forms/CurrencyInput` |
| Botão primário | `<PrimaryButton>` | `../../components/PrimaryButton` |
| Header de página | `<PageHeader>` | `../../components/PageHeader` |
| KPI Card | `<StatCard>` | `../../components/StatCard` |

### Imports Padrão de Página
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
import { formatCurrency, formatDate } from '../../utils/format';
import [Entity]Form from './components/[Entity]Form';
import [Entity]Details from './components/[Entity]Details';
```

---

## 🎨 Paleta de Cores

| Tipo | Border | Badge |
|------|--------|-------|
| FEMOG | `border-blue-500` | `bg-blue-100 text-blue-800` |
| SEMOG | `border-orange-500` | `bg-purple-100 text-purple-800` |
| Sucesso | `border-green-500` | `bg-green-100 text-green-800` |
| Alerta | `border-yellow-500` | `bg-yellow-100 text-yellow-800` |
| Erro | `border-red-500` | `bg-red-100 text-red-800` |

---

## 📦 Padrões de Componentes

### PageHeader
```tsx
<PageHeader title="[Módulo]" subtitle="[Descrição]"
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

### Filter Bar (ANTES das tabs)
```tsx
<div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
        <input type="text" placeholder="Buscar..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
    </div>
    <div className="w-full md:w-auto">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full">
            <option value="TODOS">Todos</option>
        </select>
    </div>
</div>
```

### Company/View Tabs (DEPOIS dos filtros)
```tsx
<div className="flex bg-white p-1 rounded-lg w-fit shadow-sm overflow-x-auto">
    {['TODOS','SEMOG','FEMOG'].map(tab => (
        <button key={tab} onClick={() => setCompanyFilter(tab)}
            className={`px-6 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                companyFilter===tab
                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}>{tab==='TODOS'?'Todas':tab}</button>
    ))}
</div>
```

### ResponsiveTable
```tsx
<ResponsiveTable data={filteredData} columns={columns} keyExtractor={i => i.id}
    onRowClick={handleView} loading={isLoading} skeletonRows={5}
    getRowBorderColor={i => i.empresa==='FEMOG'?'border-blue-500':'border-orange-500'}
    renderCard={i => (
        <div className={`border-l-4 pl-3 ${i.empresa==='FEMOG'?'border-l-blue-500':'border-l-orange-500'}`}>
            {/* Card content - mobile */}
        </div>
    )}
/>
```

---

## 🏷️ Badges (Tags)

> **OBRIGATÓRIO:** Usar componentes padronizados. NUNCA `<span>` manual com cores.

### 1. Empresa
```tsx
<CompanyBadge company={item.empresa} />  // FEMOG: blue, SEMOG: purple
```

### 2. Status Booleano
```tsx
<StatusBadge active={item.status === 'ativo'} />
<StatusBadge active={item.status === 'aberto'} activeLabel="Aberto" inactiveLabel="Fechado" />
```

### 3. Status Textual Customizado (quando não há componente)
```tsx
<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    item.tipo === 'Oficial' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
}`}>{item.tipo}</span>
```

---

## 🪟 Modal Patterns

### View Modal
```tsx
openViewModal('Detalhes do/da [Entidade]', <[Entity]Details [entity]={item}/>, {
    canEdit: true, canDelete: true,
    onEdit: () => openFormModal('Editar', <[Entity]Form initialData={item} onSuccess={refetch}/>),
    onDelete: () => openConfirmModal('Excluir', 'Confirma exclusão?', async () => {
        await deleteEntity(item.id);
        showFeedback('success', 'Excluído!');
    }),
});
```

> **Regra de Título:** SEMPRE "Detalhes do/da [Entidade]". Nunca genérico.

### Details Component (Premium Card Pattern)
```tsx
<div className="space-y-6">
    {/* Header / Main Info */}
    <div className="flex items-start justify-between border-b border-gray-100 pb-5">
        <div>
            <h3 className="text-xl font-bold text-gray-900">{entity.nome}</h3>
            <p className="text-sm text-gray-500 mt-1">Subtítulo</p>
        </div>
        <CompanyBadge company={entity.empresa} />
    </div>

    {/* Grid Infos (Premium Cards) */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card padrão */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
            <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                <Info size={16} className="mr-2" /> [Label]
            </div>
            <div className="text-gray-900 font-semibold text-lg">{value}</div>
        </div>

        {/* Card highlight (destaque) */}
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col gap-2">
            <div className="flex items-center text-blue-700 text-sm font-medium mb-1">
                <Info size={16} className="mr-2" /> [Highlight Label]
            </div>
            <div className="text-blue-900 font-semibold text-lg">{value}</div>
        </div>
    </div>

    {/* Footer Timestamp */}
    <div className="text-xs text-gray-400 pt-4 text-center">Registrado em {formatDate(entity.created_at)}</div>
</div>
```

---

## 📝 Form Pattern

```tsx
<form onSubmit={handleSubmit} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Nome" name="nome" value="..." onChange={...} required />
        <SelectField label="Empresa" name="empresa" value="..." onChange={...}
            options={[{value: 'FEMOG', label: 'FEMOG'}, {value: 'SEMOG', label: 'SEMOG'}]} required />
        <MaskedInputField label="CPF" mask="999.999.999-99" name="cpf" value="..." onChange={...} required />
    </div>
    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
        <button type="button" onClick={closeModal}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Cancelar
        </button>
        <PrimaryButton type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
        </PrimaryButton>
    </div>
</form>
```

> **Checkbox:** `className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"`

---

## 🔤 Tipografia e Espaçamento

| Elemento | Classes |
|----------|---------|
| Título da página | `text-2xl font-bold text-gray-900` |
| Header de seção | `text-sm font-semibold text-gray-900 mb-4 pb-1 border-b` |
| Label | `text-sm font-medium text-gray-700` |
| Moeda | `font-bold text-green-700` |
| Container da página | `space-y-4` |
| Card | `p-4` |
| Grid | `gap-4` |

---

## 📱 Mobile

- Todas as tabelas DEVEM ter `renderCard` para mobile
- Cards com `border-l-4` colorido por empresa
- Filter bar: `flex-col` em mobile, `flex-row` em desktop
- Tabs com `overflow-x-auto` para scroll horizontal

---

## ♿ Acessibilidade

- `lang="pt-BR"` no `index.html`
- `focus:ring-2 focus:ring-blue-500` em todos os inputs interativos
- Labels em todos os campos de formulário
- Skeleton loader durante carregamento (nunca tela em branco)
- Feedback após ações: `showFeedback('success'|'error', mensagem)`

---

## ⚡ Performance e Deploy

### Regras Obrigatórias
- NUNCA `select('*')` → listar colunas explicitamente
- SEMPRE lazy load de rotas: `lazy(() => import(...))`
- SEMPRE DevTools condicional: `import.meta.env.DEV`
- NUNCA `console.log` em produção
- `npm run build` local com 0 erros ANTES de push

### Vercel Config
```json
{
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
    "headers": [{
        "source": "/assets/(.*)",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }]
}
```

### React Query Hook Pattern
```tsx
import { STALE_TIMES, queryKeys } from '../../../lib/queryClient';

useQuery({
    queryKey: queryKeys.[entity]s.list(),
    queryFn: () => [entity]Service.get[Entity]s(),
    staleTime: STALE_TIMES.MODERATE,  // Ajustar: STATIC(30m), DYNAMIC(2m), REALTIME(30s)
});
```

---

## 🔒 Segurança

- Toda tabela nova: RLS habilitada + policies por perfil
- Comparação case-insensitive com `LOWER()`
- NUNCA `service_role_key` no frontend
- Tabela de usuários: usar `usuarios` (NUNCA `con_usuarios`)
- Client tipado: `createClient<Database>()` com casts documentados

---

## ✅ Checklist da Página

| Item | ✓ |
|------|---|
| PageHeader com botão Novo | |
| Table renderiza dados com skeleton | |
| Mobile cards funcionam (renderCard) | |
| Filtros Search + Company tabs | |
| Filtros ANTES das tabs (ordem) | |
| View modal: "Detalhes do/da [Entidade]" | |
| Edit/Delete funcionam com feedback | |
| Form usa componentes globais (InputField/SelectField) | |
| Cache atualiza após CRUD (invalidateQueries) | |
| RLS policies aplicadas na tabela |  |
| `npm run build` local: 0 erros | |
| Rota: `routes.ts` + `App.tsx` (lazy) + Sidebar | |