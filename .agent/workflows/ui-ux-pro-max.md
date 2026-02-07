---
description: Visual standards and patterns for creating new SISMOG pages with consistent UI
---

# /ui-ux-pro-max - SISMOG Visual Standards

> This workflow defines the visual patterns and component usage for all SISMOG module pages.

---

## 📐 Page Structure

Every module page follows this vertical structure:

```
1. PageHeader (title, subtitle, action buttons)
2. KPI Cards (3-column grid, optional)
3. Filter Bar - Top (search + status dropdown)
4. Filter Bar - Bottom (company tabs)
5. ResponsiveTable (data display)
6. Loading Overlay (when fetching)
```

---

## 🎨 Color Palette

### Primary Colors
- **Blue (Primary)**: `blue-600` for buttons, `blue-500` for focus rings
- **FEMOG**: `blue-500` (borders), `blue-100/blue-800` (badges)
- **SEMOG/Alerts**: `orange-500` (borders), `purple-100/purple-800` (badges)

### Status Colors
- **Success/Active**: `green-600` text, `green-100` bg
- **Warning/Pending**: `yellow-600` text, `yellow-100` bg
- **Error/Critical**: `red-600` text, `red-100` bg

### Neutral
- **Text Primary**: `gray-900`
- **Text Secondary**: `gray-500`
- **Backgrounds**: `white`, `gray-50` (cards), `gray-100` (disabled)
- **Borders**: `gray-200` (inputs), `gray-100` (cards)

---

## 📦 Component Patterns

### 1. PageHeader
```tsx
<PageHeader
    title="[Module Name]"
    subtitle="[Module Description]"
    action={
        <PrimaryButton onClick={handleCreate}>
            <Plus size={20} className="mr-2" />
            Novo [Item]
        </PrimaryButton>
    }
/>
```

### 2. KPI Cards (3-column grid)
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="bg-white p-4 rounded-xl shadow-sm border border-[color]-100 flex items-center justify-between">
        <div>
            <p className="text-sm text-[color]-600 font-medium">[Label]</p>
            <p className="text-2xl font-bold text-gray-800">[Value]</p>
        </div>
        <div className="p-3 bg-[color]-50 text-[color]-600 rounded-lg">
            <[Icon] size={24} />
        </div>
    </div>
</div>
```
**Border/Icon colors by type:**
- Default/Total: `blue-100` / `bg-blue-50 text-blue-600`
- Warning/Pending: `yellow-100` / `bg-yellow-50 text-yellow-600`
- Success/Active: `green-100` / `bg-green-50 text-green-600`
- Critical: `red-100` / `bg-red-50 text-red-600`

### 3. Filter Bar - Top (Search + Status)
```tsx
<div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
            type="text"
            placeholder="Buscar por..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
    </div>
    <div className="w-full md:w-auto">
        <select
            className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm w-full"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
        >
            <option value="TODOS">Todos os Status</option>
            <option value="[status1]">[Label1]</option>
            <option value="[status2]">[Label2]</option>
        </select>
    </div>
</div>
```

### 4. Company Tabs
```tsx
<div className="flex bg-white p-1 rounded-lg w-fit shadow-sm">
    {['TODOS', 'SEMOG', 'FEMOG'].map((tab) => (
        <button
            key={tab}
            onClick={() => setCompanyFilter(tab as any)}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                companyFilter === tab
                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
        >
            {tab === 'TODOS' ? 'Todas' : tab}
        </button>
    ))}
</div>
```

### 5. ResponsiveTable
```tsx
<ResponsiveTable<[EntityType]>
    data={filteredItems}
    columns={columns}
    keyExtractor={(item) => item.id}
    onRowClick={handleView}
    loading={loading}
    emptyMessage="Nenhum item encontrado."
    getRowBorderColor={(item) => item.empresa === 'FEMOG' ? 'border-blue-500' : 'border-orange-500'}
    renderCard={(item) => (
        <div className={`flex flex-col gap-2 relative border-l-4 pl-3 ${item.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
            {/* Mobile card content */}
        </div>
    )}
/>
```

### 6. Loading Overlay
```tsx
{loading && (
    <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
)}
```

---

## 🪟 Modal Patterns

### View Modal (Details)
```tsx
openViewModal(
    'Detalhes do [Item]',
    <[Entity]Details [entity]={item} />,
    {
        canEdit: true,
        canDelete: true,
        onEdit: () => openFormModal('Editar [Item]', <[Entity]Form initialData={item} onSuccess={refetch} />),
        onDelete: () => handleDelete(item)
    }
);
```

**Details Component Structure:**
```tsx
<div className="space-y-4">
    {/* Header with title and badge */}
    <div className="flex items-center justify-between border-b pb-4">
        <div>
            <h3 className="text-lg font-bold text-gray-900">{entity.title}</h3>
            <p className="text-sm text-gray-500">{entity.subtitle}</p>
        </div>
        <CompanyBadge company={entity.empresa} />
    </div>

    {/* Data Grid */}
    <div className="grid grid-cols-2 gap-4">
        <div>
            <p className="text-sm font-medium text-gray-500">[Label]</p>
            <p className="text-gray-900 font-medium">{value}</p>
        </div>
    </div>

    {/* Sections with dividers */}
    <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">[Section Title]</h4>
        <div className="grid grid-cols-2 gap-4">
            {/* Section content */}
        </div>
    </div>
</div>
```

### Form Modal
```tsx
openFormModal(
    '[Action] [Item]',
    <[Entity]Form initialData={item} onSuccess={refetch} />
);
```

---

## 📝 Form Patterns

### Form Structure
```tsx
<form onSubmit={handleSubmit} className="space-y-6">
    {/* Section */}
    <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-1 border-b">
            [Section Title]
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inputs */}
        </div>
    </div>

    {/* Footer */}
    <div className="flex flex-col-reverse sm:flex-row justify-end pt-4 gap-3 border-t border-gray-200 mt-6">
        <button
            type="button"
            onClick={closeModal}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
            Cancelar
        </button>
        <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex justify-center items-center transition-colors"
        >
            {loading ? 'Salvando...' : 'Salvar [Item]'}
        </button>
    </div>
</form>
```

### Input Styling
```tsx
{/* Text/Select Input */}
<div>
    <label className="block text-sm font-medium text-gray-700">[Label]</label>
    <input
        type="text"
        name="[name]"
        value={formData.[name]}
        onChange={handleChange}
        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500"
        required
    />
</div>

{/* Currency Input */}
<CurrencyInput
    label="[Label]"
    value={formData.[name] || 0}
    onChange={(val) => handleNumberChange('[name]', val)}
/>

{/* Checkbox */}
<div className="flex items-center mt-6">
    <input
        type="checkbox"
        name="[name]"
        checked={formData.[name]}
        onChange={handleChange}
        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
    />
    <label className="ml-2 block text-sm text-gray-700">[Label]</label>
</div>
```

---

## 🏷️ Badge Components

### Company Badge
```tsx
<CompanyBadge company={item.empresa} />
```
- FEMOG: `bg-blue-100 text-blue-800`
- SEMOG: `bg-purple-100 text-purple-800`

### Status Badge
```tsx
<StatusBadge
    active={item.status === 'ativo'}
    activeLabel="Ativo"     // Optional
    inactiveLabel="Inativo" // Optional
/>
```
- Active: `bg-green-100 text-green-800`
- Inactive: `bg-gray-100 text-gray-600`

### Custom Badges
```tsx
<span className="px-2 py-1 text-xs rounded-full uppercase font-bold tracking-wide bg-[color]-100 text-[color]-800">
    {text}
</span>
```

---

## 📏 Typography

| Element | Classes |
|---------|---------|
| Page Title | `text-2xl font-bold text-gray-900` (via PageHeader) |
| Card Title | `text-lg font-bold text-gray-900` |
| Section Header | `text-sm font-semibold text-gray-900 mb-4 pb-1 border-b` |
| Label | `text-sm font-medium text-gray-700` |
| Detail Label | `text-sm font-medium text-gray-500` |
| Table Header | `text-xs font-medium text-gray-500 uppercase` |
| Body Text | `text-sm text-gray-600` or `text-gray-900` |
| Currency | `font-bold text-green-700` |

---

## 🔲 Spacing

- Page container: `space-y-6`
- Card padding: `p-4`
- Form sections: `space-y-6`
- Grid gaps: `gap-4`
- Button padding: `px-4 py-2`

---

## ✅ Checklist for New Pages

- [ ] Import required components: `PageHeader`, `PrimaryButton`, `ResponsiveTable`, `StatusBadge`, `CompanyBadge`
- [ ] Import icons from `lucide-react`
- [ ] Import `useModal` from context
- [ ] Define entity type and service
- [ ] Implement `fetchData`, `handleCreate`, `handleEdit`, `handleDelete`, `handleView`
- [ ] Define `columns` array with `key`, `header`, `render`
- [ ] Implement `filteredData` with company, status, and search filters
- [ ] Add KPI calculations (if applicable)
- [ ] Create Details component following pattern
- [ ] Create Form component following pattern
- [ ] Add loading state and overlay
