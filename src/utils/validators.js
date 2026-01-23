// src/utils/validators.js

// Validação matemática de CPF
export const validateCPF = (cpf) => {
    if (!cpf) return false;
    const cleanCPF = cpf.replace(/[^\d]+/g, '');

    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCPF)) return false; // Elimina repetidos (111.111...)

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++)
        soma = soma + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cleanCPF.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++)
        soma = soma + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cleanCPF.substring(10, 11))) return false;

    return true;
};

// Validação matemática de CNPJ
export const validateCNPJ = (cnpj) => {
    if (!cnpj) return false;
    const cleanCNPJ = cnpj.replace(/[^\d]+/g, '');

    if (cleanCNPJ.length !== 14) return false;
    if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

    let tamanho = cleanCNPJ.length - 2;
    let numeros = cleanCNPJ.substring(0, tamanho);
    let digitos = cleanCNPJ.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    tamanho = tamanho + 1;
    numeros = cleanCNPJ.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(1))) return false;

    return true;
};

// Validação de Celular/Fixo (10 ou 11 dígitos)
export const validatePhone = (phone) => {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[^\d]+/g, '');
    return cleanPhone.length === 10 || cleanPhone.length === 11;
};

// Validação de CEP (8 dígitos)
export const validateCEP = (cep) => {
    if (!cep) return false;
    const cleanCEP = cep.replace(/[^\d]+/g, '');
    return cleanCEP.length === 8;
};

// Validação de E-mail (Regex Padrão)
export const validateEmail = (email) => {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};
