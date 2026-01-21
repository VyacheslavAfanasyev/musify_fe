const API_BASE_URL = "http://localhost:3000";

// Общие типы
export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  role: "musician" | "listener";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export type RefreshTokenResponse = AuthResponse;

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  success: boolean;
  error?: string;
}

/**
 * Сохраняет данные пользователя и токены в localStorage
 */
function saveUserData(user: User, accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("userId", user.id);
  localStorage.setItem("userEmail", user.email);
  localStorage.setItem("username", user.username);
  localStorage.setItem("userRole", user.role);
}

/**
 * Очищает данные пользователя и токены из localStorage
 */
function clearUserData() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("username");
  localStorage.removeItem("userRole");
}

/**
 * Регистрирует нового пользователя
 * @param data - Данные для регистрации
 * @returns Promise с данными пользователя
 */
export async function registerUser(
  data: RegisterRequest
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // Пытаемся прочитать ответ как JSON
    let result: AuthResponse;
    try {
      result = await response.json();
    } catch {
      // Если не удалось распарсить JSON, обрабатываем по статусу
      let errorMessage = "Произошла ошибка при регистрации";
      if (response.status === 404) {
        errorMessage = "Пользователь не найден";
      } else if (response.status === 400) {
        errorMessage = "Неверные данные для регистрации";
      } else if (response.status === 409) {
        errorMessage = "Пользователь с таким email или username уже существует";
      } else if (response.status >= 500) {
        errorMessage = "Ошибка сервера. Попробуйте позже";
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Проверяем статус ответа и данные
    if (!response.ok || !result.success) {
      // Используем сообщение об ошибке из ответа или по статусу
      let errorMessage = result.error || "Произошла ошибка при регистрации";
      if (!result.error) {
        if (response.status === 404) {
          errorMessage = "Пользователь не найден";
        } else if (response.status === 400) {
          errorMessage = "Неверные данные для регистрации";
        } else if (response.status === 409) {
          errorMessage =
            "Пользователь с таким email или username уже существует";
        } else if (response.status >= 500) {
          errorMessage = "Ошибка сервера. Попробуйте позже";
        }
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    return result;
  } catch (err) {
    // Обрабатываем только реальные сетевые ошибки
    if (err instanceof TypeError && err.message.includes("fetch")) {
      return {
        success: false,
        error: "Ошибка сети. Проверьте подключение к интернету.",
      };
    } else {
      return {
        success: false,
        error: "Произошла неожиданная ошибка. Попробуйте позже.",
      };
    }
  }
}

/**
 * Выполняет вход пользователя в систему
 * @param data - Данные для входа (email и password)
 * @returns Promise с токенами и данными пользователя
 */
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // Пытаемся прочитать ответ как JSON
    let result: AuthResponse;
    try {
      result = await response.json();
    } catch {
      // Если не удалось распарсить JSON, обрабатываем по статусу
      let errorMessage = "Произошла ошибка при входе";
      if (response.status === 404) {
        errorMessage = "Пользователь не найден";
      } else if (response.status === 400) {
        errorMessage = "Неверные данные для входа";
      } else if (response.status === 401) {
        errorMessage = "Неверный email или пароль";
      } else if (response.status >= 500) {
        errorMessage = "Ошибка сервера. Попробуйте позже";
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Проверяем статус ответа и данные
    if (!response.ok || !result.success) {
      // Используем сообщение об ошибке из ответа или по статусу
      let errorMessage = result.error || "Произошла ошибка при входе";
      if (!result.error) {
        if (response.status === 404) {
          errorMessage = "Пользователь не найден";
        } else if (response.status === 400) {
          errorMessage = "Неверные данные для входа";
        } else if (response.status === 401) {
          errorMessage = "Неверный email или пароль";
        } else if (response.status >= 500) {
          errorMessage = "Ошибка сервера. Попробуйте позже";
        }
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Успешный вход - сохраняем токены и данные пользователя
    if (result.user && result.accessToken && result.refreshToken) {
      saveUserData(result.user, result.accessToken, result.refreshToken);
    }

    return result;
  } catch (err) {
    // Обрабатываем только реальные сетевые ошибки
    if (err instanceof TypeError && err.message.includes("fetch")) {
      return {
        success: false,
        error: "Ошибка сети. Проверьте подключение к интернету.",
      };
    } else {
      return {
        success: false,
        error: "Произошла неожиданная ошибка. Попробуйте позже.",
      };
    }
  }
}

/**
 * Обновляет пару access/refresh токенов
 * @param refreshToken - Refresh токен для обновления
 * @returns Promise с новыми токенами и данными пользователя
 */
export async function refreshTokens(
  refreshToken?: string
): Promise<RefreshTokenResponse> {
  // Если токен не передан, пытаемся получить из localStorage
  const token = refreshToken || localStorage.getItem("refreshToken");

  if (!token) {
    return {
      success: false,
      error: "Refresh token не найден",
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: token,
      }),
    });

    // Пытаемся прочитать ответ как JSON
    let data: RefreshTokenResponse;
    try {
      data = await response.json();
    } catch {
      // Если не удалось распарсить JSON, обрабатываем по статусу
      let errorMessage = "Произошла ошибка при обновлении токенов";
      if (response.status === 401) {
        errorMessage = "Refresh token недействителен или истек";
      } else if (response.status === 400) {
        errorMessage = "Неверный формат запроса";
      } else if (response.status >= 500) {
        errorMessage = "Ошибка сервера. Попробуйте позже";
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Проверяем статус ответа и данные
    if (!response.ok || !data.success) {
      // Используем сообщение об ошибке из ответа или по статусу
      let errorMessage =
        data.error || "Произошла ошибка при обновлении токенов";
      if (!data.error) {
        if (response.status === 401) {
          errorMessage = "Refresh token недействителен или истек";
        } else if (response.status === 400) {
          errorMessage = "Неверный формат запроса";
        } else if (response.status >= 500) {
          errorMessage = "Ошибка сервера. Попробуйте позже";
        }
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Успешное обновление токенов
    if (data.user && data.accessToken && data.refreshToken) {
      saveUserData(data.user, data.accessToken, data.refreshToken);
    }

    return data;
  } catch (err) {
    // Обрабатываем только реальные сетевые ошибки
    if (err instanceof TypeError && err.message.includes("fetch")) {
      return {
        success: false,
        error: "Ошибка сети. Проверьте подключение к интернету.",
      };
    } else {
      return {
        success: false,
        error: "Произошла неожиданная ошибка. Попробуйте позже.",
      };
    }
  }
}

/**
 * Выполняет выход пользователя из системы
 * Инвалидирует refresh токен и очищает данные из localStorage
 * @param refreshToken - Refresh токен для инвалидации (опционально, если не передан, берется из localStorage)
 * @returns Promise с результатом операции
 */
export async function logoutUser(
  refreshToken?: string
): Promise<LogoutResponse> {
  // Если токен не передан, пытаемся получить из localStorage
  const token = refreshToken || localStorage.getItem("refreshToken");

  if (!token) {
    // Если токена нет, просто очищаем localStorage
    clearUserData();
    return {
      success: true,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: token,
      }),
    });

    // Пытаемся прочитать ответ как JSON
    let result: LogoutResponse;
    try {
      result = await response.json();
    } catch {
      // Если не удалось распарсить JSON, обрабатываем по статусу
      let errorMessage = "Произошла ошибка при выходе";
      if (response.status === 400) {
        errorMessage = "Неверный формат запроса";
      } else if (response.status === 401) {
        errorMessage = "Refresh token недействителен";
      } else if (response.status >= 500) {
        errorMessage = "Ошибка сервера. Попробуйте позже";
      }
      // Даже при ошибке очищаем localStorage
      clearUserData();
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Проверяем статус ответа и данные
    if (!response.ok || !result.success) {
      // Используем сообщение об ошибке из ответа или по статусу
      let errorMessage = result.error || "Произошла ошибка при выходе";
      if (!result.error) {
        if (response.status === 400) {
          errorMessage = "Неверный формат запроса";
        } else if (response.status === 401) {
          errorMessage = "Refresh token недействителен";
        } else if (response.status >= 500) {
          errorMessage = "Ошибка сервера. Попробуйте позже";
        }
      }
      // Даже при ошибке очищаем localStorage
      clearUserData();
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Успешный выход - очищаем localStorage
    clearUserData();

    return result;
  } catch (err) {
    // Обрабатываем только реальные сетевые ошибки
    // Даже при сетевой ошибке очищаем localStorage
    clearUserData();
    if (err instanceof TypeError && err.message.includes("fetch")) {
      return {
        success: false,
        error: "Ошибка сети. Проверьте подключение к интернету.",
      };
    } else {
      return {
        success: false,
        error: "Произошла неожиданная ошибка. Попробуйте позже.",
      };
    }
  }
}
