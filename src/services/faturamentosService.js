import { supabase } from '../lib/supabase';
import { format, addMonths, isBefore, isAfter, startOfDay, parseISO, startOfMonth } from 'date-fns';
import { recebimentosService } from './recebimentosService';

export const faturamentosService = {
    // --- GERAÇÃO DE FATURAMENTOS (CORRIGIDA V2) ---
    gerarFaturamentos: async (competencia, empresaId) => {
        console.log('🚀 Iniciando geração de faturamentos', { competencia, empresaId });

        // 1. Busca Contratos Ativos
        const { data: contratos, error: errContratos } = await supabase
            .from('contratos')
            .select('*')
            .eq('empresa_id', empresaId)
            .eq('ativo', true)
            .is('deleted_at', null);

        if (errContratos) {
            console.error('❌ Erro ao buscar contratos:', errContratos);
            throw errContratos;
        }

        if (!contratos || contratos.length === 0) {
            console.warn('⚠️ Nenhum contrato ativo encontrado para empresa:', empresaId);
            return { created: 0, skipped: 0, errors: [] };
        }

        console.log(`📋 ${contratos.length} contratos ativos encontrados`);

        let createdCount = 0;
        let skippedCount = 0;
        const errors = [];

        // CORREÇÃO CRÍTICA: Normalização para formato DATE do PostgreSQL
        // A coluna 'competencia' é DATE, então precisamos garantir formato YYYY-MM-DD
        const competenciaFormatada = `${competencia}-01`; // Garante primeiro dia do mês
        const dataCompetencia = parseISO(competenciaFormatada);

        console.log('📅 Competência processada:', {
            input: competencia,
            formatada: competenciaFormatada,
            parsed: format(dataCompetencia, 'yyyy-MM-dd')
        });

        for (const contrato of contratos) {
            console.log(`\n🔍 Processando contrato ${contrato.id} - ${contrato.posto_trabalho}`);

            // REGRA 1: Contrato deve estar Ativo
            if (contrato.ativo === false) {
                console.log('  ⏭️ SKIP: Contrato inativo');
                skippedCount++;
                continue;
            }

            // CALCULA DATA DE FATURAMENTO
            const [ano, mes] = competencia.split('-').map(Number);
            const diaFat = contrato.dia_faturamento || 1;

            // Função auxiliar para calcular a data correta (evita timezone issues)
            const calcularData = (ano, mes, dia) => {
                const ultimoDiaMes = new Date(ano, mes, 0).getDate();
                const diaFinal = Math.min(dia, ultimoDiaMes);
                return `${ano}-${String(mes).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`;
            };

            const dataFaturamentoFormatada = calcularData(ano, mes, diaFat);

            // REGRA 2: Verifica duplicidade por COMPETÊNCIA (mês/ano)
            // Isso evita duplicatas mesmo se o usuário alterar a data_faturamento
            const { count, error: errCount } = await supabase
                .from('faturamentos')
                .select('*', { count: 'exact', head: true })
                .eq('contrato_id', contrato.id)
                .gte('competencia', `${competencia}-01`)
                .lte('competencia', `${competencia}-31`)
                .is('deleted_at', null);

            if (errCount) {
                console.error('  ❌ Erro ao verificar duplicidade:', errCount);
                errors.push({ contrato_id: contrato.id, error: errCount.message });
                continue;
            }

            if (count > 0) {
                console.log('  ⏭️ SKIP: Já existe faturamento para este contrato nesta competência');
                skippedCount++;
                continue;
            }

            // --- CÁLCULOS FINANCEIROS ---
            const bruto = Number(contrato.valor_contrato) || 0;
            console.log('  💰 Valor bruto:', bruto);

            const iss = contrato.retencao_iss ? bruto * ((Number(contrato.iss_perc) || 0) / 100) : 0;
            const pis = contrato.retencao_pis ? bruto * 0.0065 : 0;
            const cofins = contrato.retencao_cofins ? bruto * 0.03 : 0;
            const irpj = contrato.retencao_irpj ? bruto * 0.015 : 0;
            const csll = contrato.retencao_csll ? bruto * 0.01 : 0;
            const inss = contrato.retencao_inss ? bruto * 0.11 : 0;

            const totalImpostos = iss + pis + cofins + irpj + csll + inss;
            const liquido = bruto - totalImpostos;

            let retencaoTecnica = 0;
            if (contrato.retencao_pagamento) {
                retencaoTecnica = bruto * ((Number(contrato.retencao_pag_perc) || 0) / 100);
            }

            const valorRecebimento = liquido - retencaoTecnica;

            console.log('  📊 Cálculos:', {
                bruto,
                impostos: totalImpostos,
                liquido,
                retencaoTecnica,
                recebimento: valorRecebimento
            });

            // Calcula data de vencimento
            // Se vencimento_mes_corrente = false, o vencimento é no mês seguinte
            const diaVenc = contrato.dia_vencimento || 5;
            const vencimentoMesCorrente = contrato.vencimento_mes_corrente !== false; // Default true

            let dataVencimentoFormatada;
            if (vencimentoMesCorrente) {
                // Vencimento no mesmo mês do faturamento
                dataVencimentoFormatada = calcularData(ano, mes, diaVenc);
            } else {
                // Vencimento no mês seguinte
                let mesSeguinte = mes + 1;
                let anoVenc = ano;
                if (mesSeguinte > 12) {
                    mesSeguinte = 1;
                    anoVenc = ano + 1;
                }
                dataVencimentoFormatada = calcularData(anoVenc, mesSeguinte, diaVenc);
            }

            // PAYLOAD FINAL - GARANTINDO TIPOS CORRETOS
            const faturamento = {
                empresa_id: empresaId,
                contrato_id: contrato.id,
                competencia: dataFaturamentoFormatada, // DATE: 'YYYY-MM-DD' (mesma data do faturamento para filtro correto)
                data_faturamento: dataFaturamentoFormatada, // DATE: 'YYYY-MM-DD' (usa dia_faturamento do contrato)
                data_vencimento: dataVencimentoFormatada, // DATE: 'YYYY-MM-DD'
                data_recebimento_esperada: dataVencimentoFormatada, // DATE: 'YYYY-MM-DD'
                valor_bruto: Number(bruto), // NUMERIC
                acrescimo: 0, // NUMERIC
                desconto: 0, // NUMERIC
                iss_retido: Boolean(contrato.retencao_iss), // BOOLEAN
                iss_valor: Number(iss), // NUMERIC
                pis_retido: Boolean(contrato.retencao_pis), // BOOLEAN
                pis_valor: Number(pis), // NUMERIC
                cofins_retido: Boolean(contrato.retencao_cofins), // BOOLEAN
                cofins_valor: Number(cofins), // NUMERIC
                irpj_retido: Boolean(contrato.retencao_irpj), // BOOLEAN
                irpj_valor: Number(irpj), // NUMERIC
                csll_retido: Boolean(contrato.retencao_csll), // BOOLEAN
                csll_valor: Number(csll), // NUMERIC
                inss_retido: Boolean(contrato.retencao_inss), // BOOLEAN
                inss_valor: Number(inss), // NUMERIC
                valor_liquido: Number(liquido), // NUMERIC
                retencao_tec_valor: Number(retencaoTecnica), // NUMERIC
                valor_recebimento: Number(valorRecebimento), // NUMERIC
                status: 'Pendente', // TEXT
                observacoes: '' // TEXT
            };

            console.log('  💾 Payload preparado:', {
                competencia: faturamento.competencia,
                data_vencimento: faturamento.data_vencimento,
                valor_bruto: faturamento.valor_bruto
            });

            const { data: inserted, error: errInsert } = await supabase
                .from('faturamentos')
                .insert(faturamento)
                .select()
                .single();

            if (errInsert) {
                console.error(`  ❌ ERRO AO INSERIR:`, {
                    message: errInsert.message,
                    details: errInsert.details,
                    hint: errInsert.hint,
                    code: errInsert.code
                });
                errors.push({
                    contrato_id: contrato.id,
                    posto: contrato.posto_trabalho,
                    error: errInsert.message,
                    details: errInsert.details
                });
            } else {
                console.log('  ✅ Faturamento criado:', inserted?.id);
                createdCount++;
            }
        }

        const result = { created: createdCount, skipped: skippedCount, errors };
        console.log('\n📈 Resumo final:', result);

        if (errors.length > 0) {
            console.warn('⚠️ Erros durante geração:', errors);
        }

        return result;
    },

    // --- CRUD PADRÃO (Mantido) ---
    getAll: async () => {
        const { data, error } = await supabase
            .from('faturamentos')
            .select(`
                *,
                empresas (id, nome_empresa),
                contratos (id, posto_trabalho)
            `)
            .is('deleted_at', null)
            .order('data_vencimento', { ascending: false });
        if (error) throw error;
        return data;
    },

    update: async (id, faturamento) => {
        const { error } = await supabase
            .from('faturamentos')
            .update({ ...faturamento, updated_at: new Date() })
            .eq('id', id);
        if (error) throw error;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('faturamentos')
            .update({ deleted_at: new Date() })
            .eq('id', id);
        if (error) throw error;
    },

    updateStatus: async (id, status, faturamento = null) => {
        const { error } = await supabase
            .from('faturamentos')
            .update({ status, updated_at: new Date() })
            .eq('id', id);
        if (error) throw error;

        // Se marcou como Faturado, criar recebimento automaticamente
        if (status === 'Faturado' && faturamento) {
            try {
                await recebimentosService.createFromFaturamento(faturamento);
                console.log('✅ Recebimento criado automaticamente para faturamento:', id);
            } catch (errReceb) {
                console.error('⚠️ Erro ao criar recebimento:', errReceb);
                // Não lança erro para não interromper o fluxo principal
            }
        }
    },

    // Desfaz faturamento e exclui recebimento associado
    desfazerFaturamento: async (id) => {
        // Primeiro exclui o recebimento (mesmo se já foi recebido)
        try {
            await recebimentosService.deleteByFaturamentoId(id);
            console.log('🗑️ Recebimento excluído para faturamento:', id);
        } catch (errReceb) {
            console.error('⚠️ Erro ao excluir recebimento:', errReceb);
        }

        // Depois volta o status para Pendente
        const { error } = await supabase
            .from('faturamentos')
            .update({ status: 'Pendente', updated_at: new Date() })
            .eq('id', id);
        if (error) throw error;
    }
};
