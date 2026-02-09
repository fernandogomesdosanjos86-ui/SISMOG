-- Create funcionarios table
create table public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  empresa text not null check (empresa in ('FEMOG', 'SEMOG')),
  nome text not null,
  cpf text unique,
  cargo_id uuid references public.cargos_salarios(id),
  tipo_contrato text,
  banco text,
  agencia text,
  conta text,
  pix text,
  status text default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.funcionarios enable row level security;

-- Policies
create policy "Enable read access for authenticated users"
on public.funcionarios for select
to authenticated
using (true);

create policy "Enable insert for authenticated users"
on public.funcionarios for insert
to authenticated
with check (true);

create policy "Enable update for authenticated users"
on public.funcionarios for update
to authenticated
using (true);

create policy "Enable delete for authenticated users"
on public.funcionarios for delete
to authenticated
using (true);
