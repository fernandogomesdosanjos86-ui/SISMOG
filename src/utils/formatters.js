
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// 000.000.000-00
export const normalizeCPF = (value) => {
    if (!value) return '';
    return value
        .replace(/\D/g, '') // Remove tudo que não é dígito
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1'); // Limita o tamanho
};

// 00.000.000/0000-00
export const normalizeCNPJ = (value) => {
    if (!value) return '';
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

// (00) 00000-0000
export const normalizePhone = (value) => {
    if (!value) return '';
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

// 00000-000
export const normalizeCep = (value) => {
    if (!value) return '';
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
};

// Moeda R$ 1.000,00
export const normalizeCurrency = (value) => {
    if (!value) return '';
    // Remove tudo que não é dígito
    const onlyDigits = String(value).replace(/\D/g, '');

    // Converte para centavos (ex: 1000 -> 10.00)
    const numberValue = Number(onlyDigits) / 100;

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numberValue);
};

// Helper para converter string de moeda (R$ 1.000,00) em number (1000.00)
export const parseCurrency = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove tudo exceto números e vírgula/ponto para decimal? 
    // Assumindo formato pt-BR (R$ 1.000,00)
    // Remove não dígitos e virgula
    const cleanValue = String(value).replace(/[^\d,]/g, '').replace(',', '.');
    return Number(cleanValue) || 0;
};

// Função helper para limpar formatação ao enviar pro banco
export const stripNonNumeric = (value) => {
    return value ? value.replace(/\D/g, '') : '';
};

// R$ 1.500,00
export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

// 25/12/2023
export const formatDate = (dateString) => {
    if (!dateString) return '-';

    // Corrige problema de timezone para datas no formato 'YYYY-MM-DD'
    // Adiciona horário ao meio-dia para evitar que o JavaScript interprete como UTC
    let dateToFormat;
    if (typeof dateString === 'string') {
        if (dateString.includes('T')) {
            // ISO string completa - usa parseISO
            dateToFormat = parseISO(dateString);
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            // Formato DATE do PostgreSQL (YYYY-MM-DD) - adiciona meio-dia para evitar timezone shift
            dateToFormat = parseISO(dateString + 'T12:00:00');
        } else {
            dateToFormat = new Date(dateString);
        }
    } else {
        dateToFormat = new Date(dateString);
    }

    return format(dateToFormat, 'dd/MM/yyyy', { locale: ptBR });
};

// (27) 99999-9999 (Aplica a máscara visualmente num valor limpo do banco)
export const formatPhone = (phone) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
};
