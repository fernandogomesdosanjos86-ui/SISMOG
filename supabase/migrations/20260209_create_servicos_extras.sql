-- Create servicos_extras table
create table public.servicos_extras (
  id uuid primary key default gen_random_uuid(),
  empresa text not null check (empresa in ('FEMOG', 'SEMOG')),
  posto_id uuid not null references public.postos_trabalho(id) on delete restrict,
  funcionario_id uuid not null references public.funcionarios(id) on delete restrict,
  cargo_id uuid not null references public.cargos_salarios(id) on delete restrict,
  turno text not null check (turno in ('Diurno', 'Noturno')),
  entrada timestamptz not null,
  saida timestamptz not null,
  duracao numeric(10, 2) not null,
  valor_hora numeric(10, 2) not null,
  valor numeric(10, 2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint check_saida_maior_entrada check (saida > entrada)
);

-- Enable RLS
alter table public.servicos_extras enable row level security;

-- Policies
create policy "Enable read access for authenticated users"
on public.servicos_extras
for select
to authenticated
using (true);

create policy "Enable insert access for authenticated users"
on public.servicos_extras
for insert
to authenticated
with check (true);

create policy "Enable update access for authenticated users"
on public.servicos_extras
for update
to authenticated
using (true);

create policy "Enable delete access for authenticated users"
on public.servicos_extras
for delete
to authenticated
using (true);
