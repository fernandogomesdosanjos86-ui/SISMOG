/**
 * Custom error classes for typed error handling
 */

export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        code: string = 'APP_ERROR',
        statusCode: number = 500,
        isOperational: boolean = true
    ) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export class NetworkError extends AppError {
    constructor(message: string = 'Erro de conexão. Verifique sua internet.') {
        super(message, 'NETWORK_ERROR', 0, true);
        this.name = 'NetworkError';
        Object.setPrototypeOf(this, NetworkError.prototype);
    }
}

export class ValidationError extends AppError {
    public readonly fields: Record<string, string>;

    constructor(
        message: string = 'Dados inválidos.',
        fields: Record<string, string> = {}
    ) {
        super(message, 'VALIDATION_ERROR', 400, true);
        this.name = 'ValidationError';
        this.fields = fields;
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Recurso') {
        super(`${resource} não encontrado.`, 'NOT_FOUND', 404, true);
        this.name = 'NotFoundError';
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Você não tem permissão para esta ação.') {
        super(message, 'UNAUTHORIZED', 401, true);
        this.name = 'UnauthorizedError';
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Conflito: o registro já existe.') {
        super(message, 'CONFLICT', 409, true);
        this.name = 'ConflictError';
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}

/**
 * Parse Supabase error to typed AppError
 */
export function parseSupabaseError(error: any): AppError {
    if (!error) return new AppError('Erro desconhecido');

    const message = error.message || error.error_description || 'Erro desconhecido';
    const code = error.code || '';

    // Network errors
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
        return new NetworkError();
    }

    // Supabase specific codes
    switch (code) {
        case '23505': // unique_violation
            return new ConflictError('Este registro já existe.');
        case '23503': // foreign_key_violation
            return new ValidationError('Referência inválida. Verifique os dados relacionados.');
        case '42501': // insufficient_privilege
            return new UnauthorizedError();
        case 'PGRST116': // Row not found
            return new NotFoundError();
        default:
            return new AppError(message, code, error.status || 500);
    }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
    if (error instanceof AppError) {
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'Ocorreu um erro inesperado. Tente novamente.';
}
