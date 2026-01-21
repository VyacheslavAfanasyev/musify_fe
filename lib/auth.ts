const API_BASE_URL = "http://localhost:3000";

export interface RefreshTokenResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
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
      let errorMessage = data.error || "Произошла ошибка при обновлении токенов";
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
      // Обновляем токены и данные пользователя в localStorage
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("username", data.user.username);
      localStorage.setItem("userRole", data.user.role);
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

