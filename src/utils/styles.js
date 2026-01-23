// src/utils/styles.js

// Paleta segura para empresas novas (excluindo azul e laranja reservados)
const SAFE_COLORS = ['purple', 'emerald', 'indigo', 'rose', 'cyan', 'teal', 'fuchsia', 'violet'];

// Mapeamento explícito para o Tailwind detectar as classes
const COLOR_MAP = {
    date: { // Fallback ou uso geral
        border: 'border-l-slate-500',
        badge: 'bg-slate-50 text-slate-700 border-slate-200'
    },
    orange: {
        border: 'border-l-orange-500',
        badge: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    blue: {
        border: 'border-l-blue-500',
        badge: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    purple: {
        border: 'border-l-purple-500',
        badge: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    emerald: {
        border: 'border-l-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    indigo: {
        border: 'border-l-indigo-500',
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    rose: {
        border: 'border-l-rose-500',
        badge: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    cyan: {
        border: 'border-l-cyan-500',
        badge: 'bg-cyan-50 text-cyan-700 border-cyan-200'
    },
    teal: {
        border: 'border-l-teal-500',
        badge: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    fuchsia: {
        border: 'border-l-fuchsia-500',
        badge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
    },
    violet: {
        border: 'border-l-violet-500',
        badge: 'bg-violet-50 text-violet-700 border-violet-200'
    }
};

const getBaseColor = (nomeEmpresa) => {
    // Adicionado .trim() para evitar diferenças por espaço em branco
    const nome = (nomeEmpresa?.toLowerCase() || '').trim();

    // 1. Regra Legada Fixa
    if (nome.includes('semog')) return 'orange';
    if (nome.includes('femog')) return 'blue';

    // 2. Regra Dinâmica (Hash Consistente)
    let hash = 0;
    for (let i = 0; i < nome.length; i++) {
        hash = nome.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SAFE_COLORS.length;
    return SAFE_COLORS[index];
};

export const getBorderColor = (nomeEmpresa) => {
    const color = getBaseColor(nomeEmpresa);
    return COLOR_MAP[color]?.border || `border-l-${color}-500`; // Fallback
};

export const getBadgeStyle = (nomeEmpresa) => {
    const color = getBaseColor(nomeEmpresa);
    // Retorna cores de fundo, texto e cor da borda (suave 200, similar ao status)
    return COLOR_MAP[color]?.badge || `bg-${color}-50 text-${color}-700 border-${color}-200`;
};
