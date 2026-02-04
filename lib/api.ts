/**
 * Общие утилиты для работы с API
 */

export const API_BASE_URL = "http://localhost:3000";

/**
 * Базовый интерфейс для всех ответов API
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  [key: string]: unknown; // Позволяет добавлять дополнительные поля
}

/**
 * Опции для обработки ошибок HTTP статусов
 */
export interface ErrorHandlers {
  [status: number]: string;
  default?: string;
}

/**
 * Опции для выполнения запроса
 */
export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit;
  requireAuth?: boolean;
  errorHandlers?: ErrorHandlers;
  defaultErrorMessage?: string;
}

/**
 * Получает access token из localStorage
 */
export function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

/**
 * Проверяет наличие access token
 */
export function requireAuth(): { success: false; error: string } | null {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return {
      success: false,
      error: "Требуется авторизация",
    };
  }
  return null;
}

/**
 * Получает сообщение об ошибке на основе HTTP статуса
 */
function getErrorMessageByStatus(
  status: number,
  errorHandlers?: ErrorHandlers,
  defaultMessage?: string
): string {
  if (errorHandlers && errorHandlers[status]) {
    return errorHandlers[status];
  }

  // Стандартные сообщения для общих статусов
  const standardMessages: Record<number, string> = {
    400: "Неверный формат запроса",
    401: "Требуется авторизация",
    403: "Доступ запрещен",
    404: "Ресурс не найден",
    409: "Конфликт данных",
    413: "Файл слишком большой",
    429: "Превышен лимит запросов",
  };

  if (standardMessages[status]) {
    return standardMessages[status];
  }

  if (status >= 500) {
    return "Ошибка сервера. Попробуйте позже";
  }

  return defaultMessage || "Произошла ошибка";
}

/**
 * Обрабатывает HTTP ответ и возвращает результат
 */
export async function handleApiResponse<T extends ApiResponse>(
  response: Response,
  errorHandlers?: ErrorHandlers,
  defaultErrorMessage?: string
): Promise<T> {
  let result: T;

  try {
    result = await response.json();
  } catch {
    // Если не удалось распарсить JSON, обрабатываем по статусу
    const errorMessage = getErrorMessageByStatus(
      response.status,
      errorHandlers,
      defaultErrorMessage
    );
    return {
      success: false,
      error: errorMessage,
    } as T;
  }

  // Проверяем статус ответа и данные
  if (!response.ok || !result.success) {
    const errorMessage =
      result.error ||
      getErrorMessageByStatus(
        response.status,
        errorHandlers,
        defaultErrorMessage
      );
    return {
      ...result,
      success: false,
      error: errorMessage,
    } as T;
  }

  return result;
}

/**
 * Обрабатывает сетевые ошибки
 */
export function handleNetworkError<T extends ApiResponse>(
  err: unknown,
  defaultErrorMessage?: string
): T {
  if (err instanceof TypeError && err.message.includes("fetch")) {
    return {
      success: false,
      error: "Ошибка сети. Проверьте подключение к интернету.",
    } as T;
  }
  return {
    success: false,
    error:
      defaultErrorMessage || "Произошла неожиданная ошибка. Попробуйте позже.",
  } as T;
}

/**
 * Выполняет авторизованный запрос к API
 */
export async function makeAuthorizedRequest<T extends ApiResponse>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    headers = {},
    body,
    requireAuth: needsAuth = true,
    errorHandlers,
    defaultErrorMessage,
  } = options;

  // Проверка авторизации
  if (needsAuth) {
    const authError = requireAuth();
    if (authError) {
      return authError as T;
    }
  }

  try {
    // Добавляем токен авторизации, если требуется
    const requestHeaders: Record<string, string> = { ...headers };
    if (needsAuth) {
      const accessToken = getAccessToken();
      if (accessToken) {
        requestHeaders.Authorization = `Bearer ${accessToken}`;
      }
    }

    // Добавляем Content-Type для JSON, если не указан и body - строка (не FormData)
    if (!requestHeaders["Content-Type"] && body && typeof body === "string") {
      requestHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body,
    });

    return await handleApiResponse<T>(
      response,
      errorHandlers,
      defaultErrorMessage
    );
  } catch (err) {
    return handleNetworkError<T>(err, defaultErrorMessage);
  }
}

/**
 * Выполняет неавторизованный запрос к API
 */
export async function makeRequest<T extends ApiResponse>(
  url: string,
  options: Omit<RequestOptions, "requireAuth"> = {}
): Promise<T> {
  return makeAuthorizedRequest<T>(url, { ...options, requireAuth: false });
}
