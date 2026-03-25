/**
 * Normaliza uma string para busca "tolerante"
 * Remove acentos, cedilhas e converte para minúsculas.
 * Mantém espaços e caracteres alfanuméricos.
 */
export function normalizeSearchString(str: string | null | undefined): string {
    if (!str) return '';
    
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .toLowerCase()
        .trim();
}

/**
 * Verifica se uma string contém o termo de busca, de forma tolerante (acentos/case)
 */
export function tolerantIncludes(source: string | null | undefined, searchTerm: string): boolean {
    if (!searchTerm) return true;
    if (!source) return false;
    
    const normalizedSource = normalizeSearchString(source);
    const normalizedTerm = normalizeSearchString(searchTerm);
    
    return normalizedSource.includes(normalizedTerm);
}
