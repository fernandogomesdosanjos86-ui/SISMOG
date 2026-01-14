import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');

let env = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFinanceiro() {
    console.log('--- VERIFICANDO TABELAS FINANCEIRO ---');

    // Check Contas Corrente
    const resContas = await supabase.from('financeiro_contas_corrente').select('count', { count: 'exact', head: true });
    if (resContas.error) {
        console.error('❌ ERRO Contas Corrente:', resContas.error.message);
    } else {
        console.log('✅ Contas Corrente: OK (Acesso confirmado)');
    }

    // Check Cartões de Crédito
    const resCartoes = await supabase.from('financeiro_cartoes_credito').select('count', { count: 'exact', head: true });
    if (resCartoes.error) {
        console.error('❌ ERRO Cartões de Crédito:', resCartoes.error.message);
    } else {
        console.log('✅ Cartões de Crédito: OK (Acesso confirmado)');
    }

    // Check Empresas Relation (if possible, just check if we can query it)
    const resEmpresas = await supabase.from('empresas').select('count', { count: 'exact', head: true });
    if (resEmpresas.error) {
        console.error('❌ ERRO Empresas:', resEmpresas.error.message);
    } else {
        console.log('✅ Empresas: OK (Acesso confirmado)');
    }
}

checkFinanceiro();
