---
trigger: always_on
---

# REGRAS DE DESENVOLVIMENTO - SISMOG V2 (Atualizado)

## 1. DESIGN SYSTEM & UI SPECS
- **Cores Semânticas:**
  - Background: `bg-slate-50` (App), `bg-white` (Cards).
  - Ações: `blue-600` (Primária), `emerald-600` (Sucesso), `red-600` (Erro).
- **Componentes Base:** Ícones `lucide-react`, Inputs com labels claros.

## 2. INFRAESTRUTURA COMPARTILHADA (MANDATÓRIO)
O sistema possui uma biblioteca de utilitários robusta. É **PROIBIDO** reescrever lógica que já existe.
- **Identidade Visual (Cores):** JAMAIS crie funções `getBorderColor` locais. Importe de `../../utils/styles`.
- **Filtros de Empresa:** Não faça loops manuais. Use `<CompanyTabs />` de `../../components/ui/CompanyTabs`.
- **Status Visual:** Use `<StatusBadge />` de `../../components/ui/StatusBadge` (Aceita boolean ou string).
- **Identificação de Empresa:** Em tabelas de relacionamento (Postos, Contratos, etc.), **NÃO** exiba apenas o nome em texto. Use OBRIGATORIAMENTE `<CompanyBadge />` de `../../components/ui/CompanyBadge`.
- **Formulários:** Para inputs com máscara (CPF, CNPJ, Moeda, CEP), use OBRIGATORIAMENTE `<InputMask mask="..." />` de `../../components/ui/InputMask`.

## 3. UX DE LISTAGEM & INTERAÇÃO
- **Visualização (View):**
  - **Padrão:** MODAL CENTRALIZADO (`fixed inset-0 flex items-center justify-center`).
  - **Proibição:** É proibido usar Drawers/Gavetas Laterais para leitura de dados.
- **Tabelas:** Linhas com `cursor-pointer`, `hover:bg-slate-50` e borda lateral colorida (`border-l-4`).
- **Ações:** Use `<TableActionButtons />` para padronizar os ícones de Editar/Excluir.

3.1 PADRÃO DE VISUALIZAÇÃO OBRIGATÓRIO

Interatividade Total: Toda linha de tabela (<tr>) ou card mobile deve possuir o evento onClick associado à visualização de dados (handleOpenView).


Feedback Visual: É obrigatório o uso da classe cursor-pointer em elementos clicáveis de listagem.


Estado de Interface: Toda página de CRUD deve implementar a constante isViewMode para controlar a desabilitação de campos no modal.


Campos do Formulário: Em modo de visualização (isViewMode === true), todos os componentes de input (InputMask, select, input) devem receber a propriedade disabled

## 4. DATABASE & DADOS
- **Padronização de Status:**
  - **Novas Tabelas:** Use coluna `ativo` (BOOLEAN) default `true`.
  - **Legado:** Se encontrar tabelas antigas com `status` (Texto), trate no frontend com `zod.transform` ou realize a migração SQL para `ativo` (Boolean).
- **Validação de Dados:**
  - Use `src/utils/validators.js` dentro do schema Zod (`.refine(validateCPF, ...)`).
- **Soft Delete:** Obrigatório coluna `deleted_at`.

## 5. TECH STACK
- React 19 + Tailwind v4 + Supabase + React Hook Form + Zod.
- **Datas:** Use `date-fns`. Ao receber do banco, trate ISO Strings (`.split('T')[0]`) antes de jogar no input date.

## 6. SEGURANÇA DE PAYLOAD (CRUD)
Ao criar funções de `create` ou `update` nos services:
1. **Sanitização:** O payload enviado ao Supabase NÃO pode conter objetos aninhados (Joins).
   - *Exemplo de Erro:* Enviar `{ id: 1, nome: 'João', empresas: { nome: 'Femog' } }`.
   - *Correção:* Extraia apenas os campos da tabela alvo antes de salvar.
2. **Campos Protegidos:** Nunca envie `created_at`, `updated_at` ou `id` (no create) manualmente, deixe o banco gerar.