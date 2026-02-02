// Script de teste de conexão com Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lkpphckntubcngekcwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcHBoY2tudHViY25nZWtjd2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzc4ODIsImV4cCI6MjA4NTI1Mzg4Mn0._GeQ3RLhiTtQBGf8YpJKIn0mAxbht4YyVKspjFF2MSU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Testando conexão com Supabase...\n');

// Teste 1: Verificar se consegue conectar
console.log('1. Verificando URL:', supabaseUrl);

// Teste 2: Tentar buscar usuários
const testQuery = async () => {
    console.log('\n2. Tentando buscar usuários...');
    const { data, error } = await supabase
        .from('usuarios')
        .select('*');

    if (error) {
        console.error('❌ ERRO ao buscar usuários:');
        console.error('Código:', error.code);
        console.error('Mensagem:', error.message);
        console.error('Detalhes:', error.details);
        console.error('\n⚠️  DIAGNÓSTICO: Provavelmente falta política RLS!');
    } else {
        console.log('✅ Sucesso! Encontrados', data?.length || 0, 'usuários');
        if (data && data.length > 0) {
            console.log('\nPrimeiro usuário:', data[0]);
        }
    }
};

testQuery();
