export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alocacoes_funcionarios: {
        Row: {
          created_at: string | null
          escala: string | null
          funcionario_id: string
          he: boolean | null
          id: string
          posto_id: string
          turno: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          escala?: string | null
          funcionario_id: string
          he?: boolean | null
          id?: string
          posto_id: string
          turno?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          escala?: string | null
          funcionario_id?: string
          he?: boolean | null
          id?: string
          posto_id?: string
          turno?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alocacoes_funcionarios_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alocacoes_funcionarios_posto_id_fkey"
            columns: ["posto_id"]
            isOneToOne: false
            referencedRelation: "postos_trabalho"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos_salarios: {
        Row: {
          cargo: string
          created_at: string
          empresa: string
          id: string
          perc_adc_noturno: number
          perc_desc_alim: number
          perc_insalubridade: number
          perc_intrajornada: number
          perc_periculosidade: number
          salario_base: number
          uf: string
          updated_at: string
          valor_aux_alim: number
          valor_he_diurno: number
          valor_he_noturno: number
        }
        Insert: {
          cargo: string
          created_at?: string
          empresa: string
          id?: string
          perc_adc_noturno?: number
          perc_desc_alim?: number
          perc_insalubridade?: number
          perc_intrajornada?: number
          perc_periculosidade?: number
          salario_base?: number
          uf: string
          updated_at?: string
          valor_aux_alim?: number
          valor_he_diurno?: number
          valor_he_noturno?: number
        }
        Update: {
          cargo?: string
          created_at?: string
          empresa?: string
          id?: string
          perc_adc_noturno?: number
          perc_desc_alim?: number
          perc_insalubridade?: number
          perc_intrajornada?: number
          perc_periculosidade?: number
          salario_base?: number
          uf?: string
          updated_at?: string
          valor_aux_alim?: number
          valor_he_diurno?: number
          valor_he_noturno?: number
        }
        Relationships: []
      }
      contratos: {
        Row: {
          contratante: string
          created_at: string | null
          data_inicio: string
          dia_faturamento: number
          dia_vencimento: number
          duracao_meses: number
          empresa: Database["public"]["Enums"]["empresa_enum"]
          id: string
          nome_posto: string
          perc_iss: number | null
          perc_retencao_caucao: number | null
          retencao_cofins: boolean | null
          retencao_csll: boolean | null
          retencao_inss: boolean | null
          retencao_irpj: boolean | null
          retencao_iss: boolean | null
          retencao_pis: boolean | null
          status: string | null
          tem_retencao_caucao: boolean | null
          updated_at: string | null
          valor_mensal: number
          vencimento_mes_corrente: boolean
        }
        Insert: {
          contratante: string
          created_at?: string | null
          data_inicio: string
          dia_faturamento: number
          dia_vencimento: number
          duracao_meses: number
          empresa: Database["public"]["Enums"]["empresa_enum"]
          id?: string
          nome_posto: string
          perc_iss?: number | null
          perc_retencao_caucao?: number | null
          retencao_cofins?: boolean | null
          retencao_csll?: boolean | null
          retencao_inss?: boolean | null
          retencao_irpj?: boolean | null
          retencao_iss?: boolean | null
          retencao_pis?: boolean | null
          status?: string | null
          tem_retencao_caucao?: boolean | null
          updated_at?: string | null
          valor_mensal: number
          vencimento_mes_corrente?: boolean
        }
        Update: {
          contratante?: string
          created_at?: string | null
          data_inicio?: string
          dia_faturamento?: number
          dia_vencimento?: number
          duracao_meses?: number
          empresa?: Database["public"]["Enums"]["empresa_enum"]
          id?: string
          nome_posto?: string
          perc_iss?: number | null
          perc_retencao_caucao?: number | null
          retencao_cofins?: boolean | null
          retencao_csll?: boolean | null
          retencao_inss?: boolean | null
          retencao_irpj?: boolean | null
          retencao_iss?: boolean | null
          retencao_pis?: boolean | null
          status?: string | null
          tem_retencao_caucao?: boolean | null
          updated_at?: string | null
          valor_mensal?: number
          vencimento_mes_corrente?: boolean
        }
        Relationships: []
      }
      equipamentos: {
        Row: {
          categoria: Database["public"]["Enums"]["equipamento_categoria"]
          created_at: string | null
          descricao: string
          id: string
          identificacao: string | null
          quantidade: number
          status: Database["public"]["Enums"]["equipamento_status"]
          updated_at: string | null
        }
        Insert: {
          categoria: Database["public"]["Enums"]["equipamento_categoria"]
          created_at?: string | null
          descricao: string
          id?: string
          identificacao?: string | null
          quantidade?: number
          status?: Database["public"]["Enums"]["equipamento_status"]
          updated_at?: string | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["equipamento_categoria"]
          created_at?: string | null
          descricao?: string
          id?: string
          identificacao?: string | null
          quantidade?: number
          status?: Database["public"]["Enums"]["equipamento_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      equipamentos_destinacoes: {
        Row: {
          contrato_id: string
          created_at: string | null
          equipamento_id: string
          id: string
          quantidade: number
        }
        Insert: {
          contrato_id: string
          created_at?: string | null
          equipamento_id: string
          id?: string
          quantidade?: number
        }
        Update: {
          contrato_id?: string
          created_at?: string | null
          equipamento_id?: string
          id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_destinacoes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipamentos_destinacoes_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentacoes: {
        Row: {
          created_at: string | null
          data: string
          funcionario_id: string | null
          id: string
          observacao: string | null
          posto_id: string | null
          produto_id: string
          quantidade: number
          tipo: string
        }
        Insert: {
          created_at?: string | null
          data?: string
          funcionario_id?: string | null
          id?: string
          observacao?: string | null
          posto_id?: string | null
          produto_id: string
          quantidade: number
          tipo: string
        }
        Update: {
          created_at?: string | null
          data?: string
          funcionario_id?: string | null
          id?: string
          observacao?: string | null
          posto_id?: string | null
          produto_id?: string
          quantidade?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_posto_id_fkey"
            columns: ["posto_id"]
            isOneToOne: false
            referencedRelation: "postos_trabalho"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "estoque_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_produtos: {
        Row: {
          codigo: string
          cor: string | null
          created_at: string | null
          id: string
          produto: string
          tamanho: string | null
          tipo: string
        }
        Insert: {
          codigo: string
          cor?: string | null
          created_at?: string | null
          id?: string
          produto: string
          tamanho?: string | null
          tipo: string
        }
        Update: {
          codigo?: string
          cor?: string | null
          created_at?: string | null
          id?: string
          produto?: string
          tamanho?: string | null
          tipo?: string
        }
        Relationships: []
      }
      faturamentos: {
        Row: {
          acrescimo: number | null
          competencia: string
          contrato_id: string
          created_at: string | null
          data_emissao: string | null
          data_vencimento: string | null
          desconto: number | null
          id: string
          numero_nf: string | null
          observacoes: string | null
          perc_iss: number | null
          retencao_cofins: boolean | null
          retencao_csll: boolean | null
          retencao_inss: boolean | null
          retencao_irpj: boolean | null
          retencao_iss: boolean | null
          retencao_pis: boolean | null
          status: string | null
          updated_at: string | null
          valor_base_contrato: number
          valor_bruto: number
          valor_liquido: number
          valor_retencao_cofins: number | null
          valor_retencao_csll: number | null
          valor_retencao_inss: number | null
          valor_retencao_irpj: number | null
          valor_retencao_iss: number | null
          valor_retencao_pis: number | null
        }
        Insert: {
          acrescimo?: number | null
          competencia: string
          contrato_id: string
          created_at?: string | null
          data_emissao?: string | null
          data_vencimento?: string | null
          desconto?: number | null
          id?: string
          numero_nf?: string | null
          observacoes?: string | null
          perc_iss?: number | null
          retencao_cofins?: boolean | null
          retencao_csll?: boolean | null
          retencao_inss?: boolean | null
          retencao_irpj?: boolean | null
          retencao_iss?: boolean | null
          retencao_pis?: boolean | null
          status?: string | null
          updated_at?: string | null
          valor_base_contrato: number
          valor_bruto: number
          valor_liquido: number
          valor_retencao_cofins?: number | null
          valor_retencao_csll?: number | null
          valor_retencao_inss?: number | null
          valor_retencao_irpj?: number | null
          valor_retencao_iss?: number | null
          valor_retencao_pis?: number | null
        }
        Update: {
          acrescimo?: number | null
          competencia?: string
          contrato_id?: string
          created_at?: string | null
          data_emissao?: string | null
          data_vencimento?: string | null
          desconto?: number | null
          id?: string
          numero_nf?: string | null
          observacoes?: string | null
          perc_iss?: number | null
          retencao_cofins?: boolean | null
          retencao_csll?: boolean | null
          retencao_inss?: boolean | null
          retencao_irpj?: boolean | null
          retencao_iss?: boolean | null
          retencao_pis?: boolean | null
          status?: string | null
          updated_at?: string | null
          valor_base_contrato?: number
          valor_bruto?: number
          valor_liquido?: number
          valor_retencao_cofins?: number | null
          valor_retencao_csll?: number | null
          valor_retencao_inss?: number | null
          valor_retencao_irpj?: number | null
          valor_retencao_iss?: number | null
          valor_retencao_pis?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "faturamentos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      frota_abastecimentos: {
        Row: {
          created_at: string
          data: string
          id: string
          km_atual: number
          litros: number
          responsavel: string
          valor: number
          veiculo_id: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          km_atual: number
          litros: number
          responsavel: string
          valor: number
          veiculo_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          km_atual?: number
          litros?: number
          responsavel?: string
          valor?: number
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "frota_abastecimentos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      frota_checklists: {
        Row: {
          avaria_manutencao: boolean
          checkitens: string[]
          created_at: string
          data: string
          descricao_avaria: string | null
          id: string
          km_atual: number
          outros_itens: string | null
          responsavel: string
          veiculo_id: string
        }
        Insert: {
          avaria_manutencao?: boolean
          checkitens?: string[]
          created_at?: string
          data: string
          descricao_avaria?: string | null
          id?: string
          km_atual: number
          outros_itens?: string | null
          responsavel: string
          veiculo_id: string
        }
        Update: {
          avaria_manutencao?: boolean
          checkitens?: string[]
          created_at?: string
          data?: string
          descricao_avaria?: string | null
          id?: string
          km_atual?: number
          outros_itens?: string | null
          responsavel?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "frota_checklists_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      frota_movimentacoes: {
        Row: {
          bateria_final: number | null
          bateria_inicial: number | null
          consumo_bateria: number | null
          consumo_kw: number | null
          created_at: string
          data_hora_final: string
          data_hora_inicial: string
          id: string
          km_final: number
          km_inicial: number
          km_rodados: number
          responsavel: string
          trajeto: string
          veiculo_id: string
        }
        Insert: {
          bateria_final?: number | null
          bateria_inicial?: number | null
          consumo_bateria?: number | null
          consumo_kw?: number | null
          created_at?: string
          data_hora_final: string
          data_hora_inicial: string
          id?: string
          km_final: number
          km_inicial: number
          km_rodados: number
          responsavel: string
          trajeto: string
          veiculo_id: string
        }
        Update: {
          bateria_final?: number | null
          bateria_inicial?: number | null
          consumo_bateria?: number | null
          consumo_kw?: number | null
          created_at?: string
          data_hora_final?: string
          data_hora_inicial?: string
          id?: string
          km_final?: number
          km_inicial?: number
          km_rodados?: number
          responsavel?: string
          trajeto?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "frota_movimentacoes_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      frota_veiculos: {
        Row: {
          abastecimento: boolean
          capacidade_bateria: number | null
          created_at: string
          id: string
          marca_modelo: string
          placa: string
          status: string
          tipo: string
        }
        Insert: {
          abastecimento?: boolean
          capacidade_bateria?: number | null
          created_at?: string
          id?: string
          marca_modelo: string
          placa: string
          status?: string
          tipo: string
        }
        Update: {
          abastecimento?: boolean
          capacidade_bateria?: number | null
          created_at?: string
          id?: string
          marca_modelo?: string
          placa?: string
          status?: string
          tipo?: string
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          agencia: string | null
          banco: string | null
          cargo_id: string | null
          conta: string | null
          cpf: string | null
          created_at: string | null
          empresa: string
          id: string
          nome: string
          pix: string | null
          status: string | null
          tipo_contrato: string | null
          uniforme: string | null
          updated_at: string | null
          valor_combustivel_dia: number | null
          valor_transporte_dia: number | null
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          cargo_id?: string | null
          conta?: string | null
          cpf?: string | null
          created_at?: string | null
          empresa: string
          id?: string
          nome: string
          pix?: string | null
          status?: string | null
          tipo_contrato?: string | null
          uniforme?: string | null
          updated_at?: string | null
          valor_combustivel_dia?: number | null
          valor_transporte_dia?: number | null
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          cargo_id?: string | null
          conta?: string | null
          cpf?: string | null
          created_at?: string | null
          empresa?: string
          id?: string
          nome?: string
          pix?: string | null
          status?: string | null
          tipo_contrato?: string | null
          uniforme?: string | null
          updated_at?: string | null
          valor_combustivel_dia?: number | null
          valor_transporte_dia?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos_salarios"
            referencedColumns: ["id"]
          },
        ]
      }
      geral_curriculos: {
        Row: {
          arquivo_url: string | null
          cargo: string
          created_at: string | null
          data: string
          empresa: string
          id: string
          indicacao: string | null
          nome: string
          observacoes: string | null
          status: string
        }
        Insert: {
          arquivo_url?: string | null
          cargo: string
          created_at?: string | null
          data: string
          empresa: string
          id?: string
          indicacao?: string | null
          nome: string
          observacoes?: string | null
          status: string
        }
        Update: {
          arquivo_url?: string | null
          cargo?: string
          created_at?: string | null
          data?: string
          empresa?: string
          id?: string
          indicacao?: string | null
          nome?: string
          observacoes?: string | null
          status?: string
        }
        Relationships: []
      }
      geral_missoes: {
        Row: {
          created_at: string
          id: string
          missao: string
          observacoes: string | null
          status_missao: Database["public"]["Enums"]["status_tarefa_missao"]
          tarefa_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          missao: string
          observacoes?: string | null
          status_missao?: Database["public"]["Enums"]["status_tarefa_missao"]
          tarefa_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          missao?: string
          observacoes?: string | null
          status_missao?: Database["public"]["Enums"]["status_tarefa_missao"]
          tarefa_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "geral_missoes_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "geral_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      geral_tarefa_chats: {
        Row: {
          arquivo_url: string | null
          chat: string
          created_at: string
          data_hora: string
          id: string
          tarefa_id: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          arquivo_url?: string | null
          chat: string
          created_at?: string
          data_hora?: string
          id?: string
          tarefa_id: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          arquivo_url?: string | null
          chat?: string
          created_at?: string
          data_hora?: string
          id?: string
          tarefa_id?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_chats_usuario_usuarios"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geral_tarefa_chats_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "geral_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      geral_tarefa_destinatarios: {
        Row: {
          id: string
          tarefa_id: string
          usuario_id: string
        }
        Insert: {
          id?: string
          tarefa_id: string
          usuario_id: string
        }
        Update: {
          id?: string
          tarefa_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_destinatarios_usuario_usuarios"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geral_tarefa_destinatarios_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "geral_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      geral_tarefas: {
        Row: {
          created_at: string
          data_limite: string
          data_solicitacao: string
          id: string
          prioridade: Database["public"]["Enums"]["prioridade_tarefa"]
          remetente_id: string
          status_tarefa: Database["public"]["Enums"]["status_tarefa_missao"]
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_limite: string
          data_solicitacao: string
          id?: string
          prioridade: Database["public"]["Enums"]["prioridade_tarefa"]
          remetente_id: string
          status_tarefa?: Database["public"]["Enums"]["status_tarefa_missao"]
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_limite?: string
          data_solicitacao?: string
          id?: string
          prioridade?: Database["public"]["Enums"]["prioridade_tarefa"]
          remetente_id?: string
          status_tarefa?: Database["public"]["Enums"]["status_tarefa_missao"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tarefas_remetente_usuarios"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      postos_trabalho: {
        Row: {
          created_at: string | null
          empresa: string
          id: string
          nome: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          empresa: string
          id?: string
          nome: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          empresa?: string
          id?: string
          nome?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recebimentos: {
        Row: {
          acrescimo: number | null
          competencia: string
          created_at: string | null
          data_recebimento: string | null
          desconto: number | null
          descricao: string | null
          empresa: Database["public"]["Enums"]["empresa_enum"] | null
          faturamento_id: string | null
          id: string
          observacoes: string | null
          perc_retencao_caucao: number | null
          status: string | null
          tem_retencao_caucao: boolean | null
          tipo: string
          updated_at: string | null
          valor_base: number | null
          valor_faturamento_liquido: number | null
          valor_recebimento_liquido: number
          valor_retencao_caucao: number | null
        }
        Insert: {
          acrescimo?: number | null
          competencia: string
          created_at?: string | null
          data_recebimento?: string | null
          desconto?: number | null
          descricao?: string | null
          empresa?: Database["public"]["Enums"]["empresa_enum"] | null
          faturamento_id?: string | null
          id?: string
          observacoes?: string | null
          perc_retencao_caucao?: number | null
          status?: string | null
          tem_retencao_caucao?: boolean | null
          tipo: string
          updated_at?: string | null
          valor_base?: number | null
          valor_faturamento_liquido?: number | null
          valor_recebimento_liquido: number
          valor_retencao_caucao?: number | null
        }
        Update: {
          acrescimo?: number | null
          competencia?: string
          created_at?: string | null
          data_recebimento?: string | null
          desconto?: number | null
          descricao?: string | null
          empresa?: Database["public"]["Enums"]["empresa_enum"] | null
          faturamento_id?: string | null
          id?: string
          observacoes?: string | null
          perc_retencao_caucao?: number | null
          status?: string | null
          tem_retencao_caucao?: boolean | null
          tipo?: string
          updated_at?: string | null
          valor_base?: number | null
          valor_faturamento_liquido?: number | null
          valor_recebimento_liquido?: number
          valor_retencao_caucao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recebimentos_faturamento_id_fkey"
            columns: ["faturamento_id"]
            isOneToOne: false
            referencedRelation: "faturamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_beneficios_calculados: {
        Row: {
          cargo_id: string | null
          competencia: string
          created_at: string
          dias_ausente: number | null
          dias_trabalhar: number | null
          empresa: string
          funcionario_id: string | null
          id: string
          posto_id: string | null
          total_alimentacao: number | null
          total_combustivel: number | null
          total_dias: number | null
          total_geral: number | null
          total_transporte: number | null
          valor_alimentacao_dia: number | null
          valor_combustivel_dia: number | null
          valor_incentivo_mensal: number | null
          valor_transporte_dia: number | null
        }
        Insert: {
          cargo_id?: string | null
          competencia: string
          created_at?: string
          dias_ausente?: number | null
          dias_trabalhar?: number | null
          empresa: string
          funcionario_id?: string | null
          id?: string
          posto_id?: string | null
          total_alimentacao?: number | null
          total_combustivel?: number | null
          total_dias?: number | null
          total_geral?: number | null
          total_transporte?: number | null
          valor_alimentacao_dia?: number | null
          valor_combustivel_dia?: number | null
          valor_incentivo_mensal?: number | null
          valor_transporte_dia?: number | null
        }
        Update: {
          cargo_id?: string | null
          competencia?: string
          created_at?: string
          dias_ausente?: number | null
          dias_trabalhar?: number | null
          empresa?: string
          funcionario_id?: string | null
          id?: string
          posto_id?: string | null
          total_alimentacao?: number | null
          total_combustivel?: number | null
          total_dias?: number | null
          total_geral?: number | null
          total_transporte?: number | null
          valor_alimentacao_dia?: number | null
          valor_combustivel_dia?: number | null
          valor_incentivo_mensal?: number | null
          valor_transporte_dia?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rh_beneficios_calculados_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos_salarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_beneficios_calculados_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_beneficios_calculados_posto_id_fkey"
            columns: ["posto_id"]
            isOneToOne: false
            referencedRelation: "postos_trabalho"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_gratificacoes: {
        Row: {
          created_at: string
          data: string
          empresa: string
          funcionario_id: string
          gratificacao_percentual: number | null
          id: string
          incentivo_valor: number | null
          observacao: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          data: string
          empresa: string
          funcionario_id: string
          gratificacao_percentual?: number | null
          id?: string
          incentivo_valor?: number | null
          observacao?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          data?: string
          empresa?: string
          funcionario_id?: string
          gratificacao_percentual?: number | null
          id?: string
          incentivo_valor?: number | null
          observacao?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_gratificacoes_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_penalidades: {
        Row: {
          arquivo_url: string | null
          created_at: string
          data: string
          descricao: string | null
          empresa: string
          funcionario_id: string
          id: string
          penalidade: string
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string
          data: string
          descricao?: string | null
          empresa: string
          funcionario_id: string
          id?: string
          penalidade: string
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          empresa?: string
          funcionario_id?: string
          id?: string
          penalidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_penalidades_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos_extras: {
        Row: {
          cargo_id: string
          created_at: string | null
          duracao: number
          empresa: string
          entrada: string
          funcionario_id: string
          id: string
          posto_id: string
          saida: string
          turno: string
          updated_at: string | null
          valor: number
          valor_hora: number
        }
        Insert: {
          cargo_id: string
          created_at?: string | null
          duracao: number
          empresa: string
          entrada: string
          funcionario_id: string
          id?: string
          posto_id: string
          saida: string
          turno: string
          updated_at?: string | null
          valor: number
          valor_hora: number
        }
        Update: {
          cargo_id?: string
          created_at?: string | null
          duracao?: number
          empresa?: string
          entrada?: string
          funcionario_id?: string
          id?: string
          posto_id?: string
          saida?: string
          turno?: string
          updated_at?: string | null
          valor?: number
          valor_hora?: number
        }
        Relationships: [
          {
            foreignKeyName: "servicos_extras_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos_salarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_extras_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_extras_posto_id_fkey"
            columns: ["posto_id"]
            isOneToOne: false
            referencedRelation: "postos_trabalho"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisao_apontamentos: {
        Row: {
          apontamento: string
          beneficios_pts: number
          created_at: string | null
          data: string
          empresa: string
          frequencia_pts: number
          funcionario_id: string | null
          id: string
          observacao: string | null
          posto_id: string | null
          updated_at: string | null
        }
        Insert: {
          apontamento: string
          beneficios_pts?: number
          created_at?: string | null
          data: string
          empresa: string
          frequencia_pts?: number
          funcionario_id?: string | null
          id?: string
          observacao?: string | null
          posto_id?: string | null
          updated_at?: string | null
        }
        Update: {
          apontamento?: string
          beneficios_pts?: number
          created_at?: string | null
          data?: string
          empresa?: string
          frequencia_pts?: number
          funcionario_id?: string | null
          id?: string
          observacao?: string | null
          posto_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supervisao_apontamentos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisao_apontamentos_posto_id_fkey"
            columns: ["posto_id"]
            isOneToOne: false
            referencedRelation: "postos_trabalho"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisao_escalas: {
        Row: {
          competencia: string
          created_at: string | null
          dias: Json
          empresa: string
          escala: string
          funcionario_id: string | null
          id: string
          inicio_12x36: number | null
          posto_id: string | null
          qnt_dias: number
          tipo: string | null
          turno: string
          updated_at: string | null
        }
        Insert: {
          competencia: string
          created_at?: string | null
          dias?: Json
          empresa: string
          escala: string
          funcionario_id?: string | null
          id?: string
          inicio_12x36?: number | null
          posto_id?: string | null
          qnt_dias?: number
          tipo?: string | null
          turno: string
          updated_at?: string | null
        }
        Update: {
          competencia?: string
          created_at?: string | null
          dias?: Json
          empresa?: string
          escala?: string
          funcionario_id?: string | null
          id?: string
          inicio_12x36?: number | null
          posto_id?: string | null
          qnt_dias?: number
          tipo?: string | null
          turno?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supervisao_escalas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisao_escalas_posto_id_fkey"
            columns: ["posto_id"]
            isOneToOne: false
            referencedRelation: "postos_trabalho"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          cpf: string
          created_at: string | null
          email: string
          id: string
          id_autenticacao: string | null
          nome: string
          permissao: Database["public"]["Enums"]["user_permission"]
          setor: Database["public"]["Enums"]["user_sector"] | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cpf: string
          created_at?: string | null
          email: string
          id: string
          id_autenticacao?: string | null
          nome: string
          permissao: Database["public"]["Enums"]["user_permission"]
          setor?: Database["public"]["Enums"]["user_sector"] | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cpf?: string
          created_at?: string | null
          email?: string
          id?: string
          id_autenticacao?: string | null
          nome?: string
          permissao?: Database["public"]["Enums"]["user_permission"]
          setor?: Database["public"]["Enums"]["user_sector"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_abastecimentos_kpis: {
        Args: never
        Returns: {
          gasto_mes_anterior: number
          gasto_mes_atual: number
          gasto_ultimos_3_meses: number
        }[]
      }
      get_movimentacoes_kpis: {
        Args: { p_month: number; p_search_term?: string; p_year: number }
        Returns: {
          total_consumo_kw: number
          total_km_rodados: number
          total_movimentacoes: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_tarefa_participant: {
        Args: { check_tarefa_id: string }
        Returns: boolean
      }
      is_tarefa_recipient: {
        Args: { check_tarefa_id: string }
        Returns: boolean
      }
      is_tarefa_sender: { Args: { check_tarefa_id: string }; Returns: boolean }
    }
    Enums: {
      empresa_enum: "SEMOG" | "FEMOG"
      equipamento_categoria: "Armamentos" | "Coletes Balísticos" | "Munições"
      equipamento_status: "Ativo" | "Inativo"
      prioridade_tarefa: "Normal" | "Urgente"
      status_tarefa_missao: "Pendente" | "Em Andamento" | "Concluído"
      user_permission: "Adm" | "Gestor" | "Operador"
      user_sector:
        | "Direção"
        | "Dep. Pessoal"
        | "Frota"
        | "Financeiro"
        | "Supervisão"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      empresa_enum: ["SEMOG", "FEMOG"],
      equipamento_categoria: ["Armamentos", "Coletes Balísticos", "Munições"],
      equipamento_status: ["Ativo", "Inativo"],
      prioridade_tarefa: ["Normal", "Urgente"],
      status_tarefa_missao: ["Pendente", "Em Andamento", "Concluído"],
      user_permission: ["Adm", "Gestor", "Operador"],
      user_sector: [
        "Direção",
        "Dep. Pessoal",
        "Frota",
        "Financeiro",
        "Supervisão",
      ],
    },
  },
} as const
