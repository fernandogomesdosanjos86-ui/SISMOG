---
description: Criação de Novas Páginas
---

Workflow: Create New Page
This workflow guides the creation of a new standard page in SISMOG.

Prerequisites
Define the Feature Name (e.g., Veiculos)
Define the Data Type (e.g., Veiculo interface)
Supabase Table must exist
Steps
1. Structure Setup
Create directory src/features/<feature_name>.
Create src/features/<feature_name>/types.ts for interfaces.
Create src/features/<feature_name>/components folder.
2. Service Creation
Update or Create src/services/<feature>Service.ts.
Implement getAll, getById, create, update, delete.
Ensure types match the generic service responses.
3. Component Implementation
Create Form Component: components/<Feature>Form.tsx.

Accept initialData (optional) and onSuccess (void).
Use useModal to closeModal() on success.
Implement validation.
Create Main Page: <FeatureName>.tsx.

Import PageHeader, ResponsiveTable, PrimaryButton, StatusBadge, CompanyBadge.
Setup useModal and State (data, loading, filters).
Implement fetchData function.
Define Columns: Create columns array for table.
Define Mobile Card: Implement renderCard function.
Implement Filters: Add Search and Status bars matching standard layout.
Implement Details View: Create internal const DetailsComponent for openViewModal.
4. Integration
Add route constant to 
src/config/routes.ts
.
Add lazy import and Route in 
src/App.tsx
.
Add item to 
src/components/Sidebar.tsx
 navigation list.
5. Verification Checklist
 Page Header displays correctly?
 KPI Cards calculate correctly?
 Table renders with correct columns?
 Mobile view works (Cards appear)?
 Filters (Search, Status, Company) filter the list?
 "Novo" button opens Form Modal?
 Clicking a row opens View Modal?
 Edit/Delete actions in View Modal work?