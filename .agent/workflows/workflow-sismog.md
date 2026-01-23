---
description: Regras Workflow
---

# WORKFLOW OPERACIONAL - SISMOG V2

## 1. PROTOCOLO DE INICIALIZAÇÃO (CHECK DE INFRA)
Antes de gerar qualquer código de página, execute mentalmente:
1. **Verificação de Utils:** Os arquivos em `src/utils` e `src/components/shared` existem? (Resposta: SIM).
2. **Estratégia de Importação:** Ao invés de criar funções auxiliares no final do arquivo, prepare os `imports` dos utilitários existentes.

## 2. HIERARQUIA DE DECISÃO (RESOLUÇÃO DE CONFLITOS)
Você encontrará códigos legados (ex: `PostosTrabalho.jsx`, `Empresas.jsx`) que violam as regras atuais. Siga esta ordem estrita:

1. **REGRA NOVA (A Constituição):** Se a regra diz "Use Modal Central", e o código antigo usa "Drawer", **OBEDEÇA A REGRA**. Ignore o Drawer.
2. **INFRAESTRUTURA (A Ferramenta):** Se o código antigo tem `getBorderColor` manual, e a regra manda usar `uiHelpers`, **USE O UI HELPERS**.
3. **LÓGICA DE NEGÓCIO (O Exemplo):** Copie do código antigo apenas a lógica complexa de negócio (ex: como salvar relacionamentos, como usar `useFieldArray`), mas "vista" essa lógica com a nova UI padronizada.

## 3. ROTEIRO DE CRIAÇÃO (CRUD PADRÃO)
1. **Database:** Verifique tabela e tipos (Prefira Boolean para status).
2. **Service:** Crie o serviço de conexão Supabase.
3. **Schema (Zod):** Importe `validateCPF`/`validateCNPJ` de `validators.js` se necessário.
4. **Frontend (Componentes):**
   - Use `<CompanyTabs />` no topo.
   - Use `<InputMask />` nos formulários.
   - Use `<StatusBadge />` nas tabelas (coluna Status).
   - Use `<CompanyBadge />` nas tabelas (coluna Empresa).
   - Use Modal Central para Create/Edit/View.
     Topo: Header + Botão de Ação.
     Filtros: Use <TableFilters /> (com <CompanyTabs /> logo abaixo, se houver filtro por empresa).
     Tabelas: Use <StatusBadge />, <CompanyBadge /> e <TableActionButtons />

3.1 PROTOCOLO DE VISUALIZAÇÃO (MODAL & TABELA)
Sempre que criar uma listagem, siga este roteiro para garantir a automação do padrão:

Estado do Modal:

Defina const [modalMode, setModalMode] = useState('create'); .

Defina const isViewMode = modalMode === 'view'; antes do bloco de retorno.

Função de Abertura:

Crie a função handleOpenView(item) que:

Define o modo: setModalMode('view').

Carrega os dados: Itera sobre o objeto item usando setValue(key, value) do React Hook Form.

Abre o modal: setShowModal(true).

Implementação na UI:


Tabela: Aplique onClick={() => handleOpenView(item)} e className="cursor-pointer" na linha.


Ações: Passe onView={() => handleOpenView(item)} para o componente <TableActionButtons />.

Modal: Altere o título dinamicamente: {modalMode === 'view' ? 'Detalhes' : ...} .


Botões do Modal: Se isViewMode, exiba o botão "Editar" que dispara setModalMode('edit') e mude o texto de "Cancelar" para "Fechar" .

## 4. PROTOCOLO DE REFATORAÇÃO (QUANDO SOLICITADO)
Ao atualizar uma página antiga (ex: Postos):
1. Não tente "consertar" o Drawer. Remova-o e implemente o Modal Central.
2. Apague as funções auxiliares locais e substitua pelos imports compartilhados.
3. Mantenha a lógica de integração com o banco intacta.