import { supabase } from './supabase';
import type { Contrato, Faturamento, Recebimento } from '../features/financeiro/types';

export const financeiroService = {
    // --- Contratos ---
    async getContratos() {
        const { data, error } = await supabase
            .from('contratos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Contrato[];
    },

    async createContrato(contrato: Omit<Contrato, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('contratos')
            .insert(contrato)
            .select()
            .single();

        if (error) throw error;
        return data as Contrato;
    },

    async updateContrato(id: string, contrato: Partial<Contrato>) {
        const { data, error } = await supabase
            .from('contratos')
            .update(contrato)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Contrato;
    },

    async deleteContrato(id: string) {
        const { error } = await supabase
            .from('contratos')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Faturamentos ---
    async getFaturamentos(month?: string) {
        let query = supabase
            .from('faturamentos')
            .select('*, contratos(id, empresa, contratante, nome_posto)')
            .order('competencia', { ascending: false });

        if (month) {
            query = query.eq('competencia', month);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Faturamento[];
    },

    async getFaturamentosByContrato(contratoId: string) {
        const { data, error } = await supabase
            .from('faturamentos')
            .select('*')
            .eq('contrato_id', contratoId)
            .order('competencia', { ascending: false });

        if (error) throw error;
        return data as Faturamento[];
    },

    async generateFaturamentos(competencia: string) {
        // 1. Get active contracts
        const { data: contratos, error: contratosError } = await supabase
            .from('contratos')
            .select('*')
            .eq('status', 'ativo');

        if (contratosError) throw contratosError;
        if (!contratos) return [];

        const faturamentosGerados: Faturamento[] = [];

        for (const contrato of contratos) {
            // 2. Check if faturamento already exists for this competence
            const { data: existing, error: checkError } = await supabase
                .from('faturamentos')
                .select('id')
                .eq('contrato_id', contrato.id)
                .eq('competencia', competencia)
                .maybeSingle();

            if (checkError) throw checkError;
            if (existing) continue; // Skip if exists

            // 3. Calculate values
            const bruto = contrato.valor_mensal;
            const retencoes = this.calculateRetencoes(contrato, bruto);
            const liquido = bruto - retencoes.totalRetencoes;

            // 4. Calculate dates
            // Logic: If vencimento_mes_corrente is true, due date is in the same month as billing day.
            // If false, it's next month.
            // Competence is YYYY-MM-01.
            // We need to construct the emission date and due date based on the competence month.

            const compDate = new Date(competencia + 'T00:00:00'); // Ensure local time or UTC handled correctly
            // Actually, handling dates in JS can be tricky with timezone. 
            // Assuming competence is passed as 'YYYY-MM-01'.

            const year = compDate.getFullYear();
            const month = compDate.getMonth(); // 0-indexed

            // Emission Date
            const dataEmissao = new Date(year, month, contrato.dia_faturamento);

            // Due Date
            let dataVencimento;
            if (contrato.vencimento_mes_corrente) {
                dataVencimento = new Date(year, month, contrato.dia_vencimento);
            } else {
                // Next month
                dataVencimento = new Date(year, month + 1, contrato.dia_vencimento);
            }

            // Create Faturamento
            const faturamento: Partial<Faturamento> = {
                contrato_id: contrato.id,
                competencia,
                valor_base_contrato: contrato.valor_mensal,
                acrescimo: 0,
                desconto: 0,
                valor_bruto: bruto,
                retencao_pis: contrato.retencao_pis,
                valor_retencao_pis: retencoes.pis,
                retencao_cofins: contrato.retencao_cofins,
                valor_retencao_cofins: retencoes.cofins,
                retencao_irpj: contrato.retencao_irpj,
                valor_retencao_irpj: retencoes.irpj,
                retencao_csll: contrato.retencao_csll,
                valor_retencao_csll: retencoes.csll,
                retencao_inss: contrato.retencao_inss,
                valor_retencao_inss: retencoes.inss,
                retencao_iss: contrato.retencao_iss,
                perc_iss: contrato.perc_iss,
                valor_retencao_iss: retencoes.iss,
                valor_liquido: liquido,
                data_emissao: dataEmissao.toISOString().split('T')[0],
                data_vencimento: dataVencimento.toISOString().split('T')[0],
                status: 'pendente'
            };

            const { data: newFaturamento, error: createError } = await supabase
                .from('faturamentos')
                .insert(faturamento)
                .select()
                .single();

            if (createError) throw createError;
            if (newFaturamento) faturamentosGerados.push(newFaturamento as Faturamento);
        }

        return faturamentosGerados;
    },

    async updateFaturamento(id: string, faturamento: Partial<Faturamento>) {
        // Sanitize: remove joined relations or read-only fields that shouldn't be sent back
        const { contratos, ...updateData } = faturamento;

        const { data, error } = await supabase
            .from('faturamentos')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Faturamento;
    },

    async emitirNota(faturamentoId: string, numeroNf: string) {
        // 1. Get faturamento
        const { data: fat, error: fetchError } = await supabase
            .from('faturamentos')
            .select('*, contratos(tem_retencao_caucao, perc_retencao_caucao, empresa)')
            .eq('id', faturamentoId)
            .single();

        if (fetchError) throw fetchError;
        if (!fat) throw new Error('Faturamento não encontrado');

        // 2. Update status
        const { error: updateError } = await supabase
            .from('faturamentos')
            .update({ status: 'emitido', numero_nf: numeroNf })
            .eq('id', faturamentoId);

        if (updateError) throw updateError;

        // 3. Create Recebimento
        const valorLiquidoFat = fat.valor_liquido;
        let valorRetencaoCaucao = 0;

        // Check contract settings for caucao
        // Note: The structure returned by join is nested.
        // However, faturamentos table doesn't store current perc_retencao_caucao, it's on contract.
        // The requirement says "Copia todos os valores...". But looking at schema, faturamento table doesn't have caucao fields.
        // But recebimentos does. So we calculate based on contract (snapshot at this moment?? Or stored?)
        // The prompt says: "Copia todos os valores e configurações do contrato". 
        // But schema for faturamentos doesn't have caucao. Recebimentos does.
        // So we use the contract linked.

        // Safe check if contratos is array or object (single)
        const contrato = fat.contratos as any;

        if (contrato && contrato.tem_retencao_caucao) {
            valorRetencaoCaucao = fat.valor_bruto * (contrato.perc_retencao_caucao / 100);
        }

        const valorRecebimentoLiquido = valorLiquidoFat - valorRetencaoCaucao; // + acrescimo - desconto (defaults 0 for new receipt)

        // Calculate competence for receipt: 1st day of next month (based on due date logic? No.)
        // Requirement 5.5: "competencia = primeiro dia do mês da data_recebimento"
        // Requirement 2.4: "Geração de Faturamento para Janeiro/2026... Vencimento: 05/02/2026... Recebimento Competência: Janeiro/2026? No, Wait."
        // Let's re-read 5.5 carefully.
        // "Faturamento: competencia = 1st day of emission month."
        // "Recebimento: competencia = 1st day of receipt month."
        // When automatically creating receipt, what is the default data_recebimento?
        // Exemplo 7 says: "Data Recebimento: 05/02/2026" (matches due date).
        // So default data_recebimento = faturamento.data_vencimento.

        const dataRecebimento = fat.data_vencimento;
        const recCompetencia = dataRecebimento.substring(0, 7) + '-01'; // YYYY-MM-01

        const recebimento: Partial<Recebimento> = {
            faturamento_id: faturamentoId,
            empresa: contrato.empresa, // Use contract enterprise
            tipo: 'faturamento',
            competencia: recCompetencia,
            valor_faturamento_liquido: valorLiquidoFat,
            tem_retencao_caucao: contrato.tem_retencao_caucao,
            perc_retencao_caucao: contrato.perc_retencao_caucao,
            valor_retencao_caucao: valorRetencaoCaucao,
            acrescimo: 0,
            desconto: 0,
            valor_recebimento_liquido: valorRecebimentoLiquido,
            data_recebimento: dataRecebimento,
            status: 'pendente'
        };

        const { data: newRec, error: createRecError } = await supabase
            .from('recebimentos')
            .insert(recebimento)
            .select()
            .single();

        if (createRecError) throw createRecError;
        return newRec;
    },

    async desfazerFaturamento(faturamentoId: string) {
        // 1. Update status to pendente
        const { error: updateError } = await supabase
            .from('faturamentos')
            .update({ status: 'pendente', numero_nf: null }) // Clear NF?
            .eq('id', faturamentoId);

        if (updateError) throw updateError;

        // 2. Delete linked recebimento
        // The ON DELETE CASCADE on schema will handle this if we delete faturamento, but we are just updating it.
        // So we must manually delete the receipt.
        const { error: deleteError } = await supabase
            .from('recebimentos')
            .delete()
            .eq('faturamento_id', faturamentoId);

        if (deleteError) throw deleteError;
    },

    async deleteFaturamento(id: string) {
        const { error } = await supabase
            .from('faturamentos')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Recebimentos ---
    async getRecebimentos() {
        const { data, error } = await supabase
            .from('recebimentos')
            .select('*, faturamentos(contrato_id, contratos(contratante))') // Deep join for display
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Recebimento[];
    },

    async createRecebimentoAvulso(recebimento: Partial<Recebimento>) {
        const { data, error } = await supabase
            .from('recebimentos')
            .insert({ ...recebimento, tipo: 'avulso' })
            .select()
            .single();

        if (error) throw error;
        return data as Recebimento;
    },

    async updateRecebimento(id: string, recebimento: Partial<Recebimento>) {
        const { data, error } = await supabase
            .from('recebimentos')
            .update(recebimento)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Recebimento;
    },

    async registrarRecebimento(id: string) {
        const { data, error } = await supabase
            .from('recebimentos')
            .update({ status: 'recebido' })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Recebimento;
    },

    async deleteRecebimento(id: string) {
        const { error } = await supabase
            .from('recebimentos')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Helper
    calculateRetencoes(base: {
        retencao_pis: boolean;
        retencao_cofins: boolean;
        retencao_irpj: boolean;
        retencao_csll: boolean;
        retencao_inss: boolean;
        retencao_iss: boolean;
        perc_iss: number;
    }, valorBruto: number) {
        const ret = {
            pis: base.retencao_pis ? valorBruto * 0.0065 : 0,
            cofins: base.retencao_cofins ? valorBruto * 0.03 : 0,
            irpj: base.retencao_irpj ? valorBruto * 0.01 : 0,
            csll: base.retencao_csll ? valorBruto * 0.01 : 0,
            inss: base.retencao_inss ? valorBruto * 0.11 : 0,
            iss: base.retencao_iss ? valorBruto * (base.perc_iss / 100) : 0,
        };
        const total = Object.values(ret).reduce((acc, curr) => acc + curr, 0);
        return { ...ret, totalRetencoes: total };
    }
};
