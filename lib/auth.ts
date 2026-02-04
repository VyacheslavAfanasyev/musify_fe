import {
  API_BASE_URL,
  makeRequest,
  makeAuthorizedRequest,
  ApiResponse,
} from "./api";

// Общие типы
export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

export interface AuthResponse extends ApiResponse {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
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

export type LogoutResponse = ApiResponse;

export interface ChangePasswordRequest {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

export type ChangePasswordResponse = ApiResponse;

// Типы для профиля пользователя
export interface UserProfile {
  _id: string;
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  location?: string;
  genres?: string[];
  instruments?: string[];
  socialLinks?: {
    youtube?: string;
    vk?: string;
    telegram?: string;
  };
  stats?: {
    tracksCount: number;
    followersCount: number;
    followingCount: number;
    totalPlays: number;
  };
  preferences?: {
    emailNotifications: boolean;
    showOnlineStatus: boolean;
    privateProfile: boolean;
  };
  role: string;
  following?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileResponse extends ApiResponse {
  user?: UserProfile;
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
  return makeRequest<AuthResponse>(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    body: JSON.stringify(data),
    errorHandlers: {
      400: "Неверные данные для регистрации",
      404: "Пользователь не найден",
      409: "Пользователь с таким email или username уже существует",
    },
    defaultErrorMessage: "Произошла ошибка при регистрации",
  });
}

/**
 * Выполняет вход пользователя в систему
 * @param data - Данные для входа (email и password)
 * @returns Promise с токенами и данными пользователя
 */
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const result = await makeRequest<AuthResponse>(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    body: JSON.stringify(data),
    errorHandlers: {
      400: "Неверные данные для входа",
      401: "Неверный email или пароль",
      404: "Пользователь не найден",
    },
    defaultErrorMessage: "Произошла ошибка при входе",
  });

  // Успешный вход - сохраняем токены и данные пользователя
  if (
    result.success &&
    result.user &&
    result.accessToken &&
    result.refreshToken
  ) {
    saveUserData(result.user, result.accessToken, result.refreshToken);
  }

  return result;
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

  const result = await makeRequest<RefreshTokenResponse>(
    `${API_BASE_URL}/auth/refresh`,
    {
      method: "POST",
      body: JSON.stringify({ refreshToken: token }),
      errorHandlers: {
        400: "Неверный формат запроса",
        401: "Refresh token недействителен или истек",
      },
      defaultErrorMessage: "Произошла ошибка при обновлении токенов",
    }
  );

  // Успешное обновление токенов
  if (
    result.success &&
    result.user &&
    result.accessToken &&
    result.refreshToken
  ) {
    saveUserData(result.user, result.accessToken, result.refreshToken);
  }

  return result;
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

  const result = await makeRequest<LogoutResponse>(
    `${API_BASE_URL}/auth/logout`,
    {
      method: "POST",
      body: JSON.stringify({ refreshToken: token }),
      errorHandlers: {
        400: "Неверный формат запроса",
        401: "Refresh token недействителен",
      },
      defaultErrorMessage: "Произошла ошибка при выходе",
    }
  );

  // Даже при ошибке очищаем localStorage
  clearUserData();

  return result;
}

/**
 * Изменяет пароль пользователя
 * @param data - Данные для смены пароля (userId, oldPassword, newPassword)
 * @returns Promise с результатом операции
 */
export async function changePassword(
  data: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  return makeRequest<ChangePasswordResponse>(
    `${API_BASE_URL}/auth/change_pass`,
    {
      method: "POST",
      body: JSON.stringify(data),
      errorHandlers: {
        400: "Неверные данные для смены пароля",
        401: "Неверный старый пароль",
        404: "Пользователь не найден",
      },
      defaultErrorMessage: "Произошла ошибка при смене пароля",
    }
  );
}

/**
 * Получает профиль пользователя по его ID
 * @param userId - UUID пользователя
 * @returns Promise с данными профиля
 */
export async function getUserProfile(
  userId: string
): Promise<UserProfileResponse> {
  return makeAuthorizedRequest<UserProfileResponse>(
    `${API_BASE_URL}/users/${userId}/profile`,
    {
      method: "GET",
      errorHandlers: {
        404: "Профиль не найден",
      },
      defaultErrorMessage: "Произошла ошибка при получении профиля",
    }
  );
}
