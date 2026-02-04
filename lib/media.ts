const API_BASE_URL = "http://localhost:3000";

/**
 * Получает URL аватара пользователя
 * @param userId - UUID пользователя
 * @returns URL для получения аватара
 */
export function getAvatarUrl(userId: string): string {
  return `${API_BASE_URL}/media/avatar/${userId}`;
}

/**
 * Получает URL трека
 * @param trackId - ID трека
 * @returns URL для получения трека
 */
export function getTrackUrl(trackId: string): string {
  return `${API_BASE_URL}/media/track/${trackId}`;
}

export interface UploadAvatarResponse {
  success: boolean;
  file?: {
    fileId: string;
    userId: string;
    type: string;
    originalName: string;
    fileName: string;
    mimeType: string;
    size: number;
    url: string;
    metadata?: {
      width: number;
      height: number;
      format: string;
    };
    createdAt: string;
  };
  error?: string;
}

/**
 * Загружает аватар пользователя
 * @param file - Файл изображения для загрузки
 * @param userId - UUID пользователя
 * @returns Promise с результатом загрузки и URL аватара
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<UploadAvatarResponse> {
  try {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      return {
        success: false,
        error: "Требуется авторизация",
      };
    }

    // Проверяем тип файла
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Неподдерживаемый формат файла. Используйте JPG, PNG или WebP",
      };
    }

    // Создаем FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);
    formData.append("type", "avatar");

    const response = await fetch(`${API_BASE_URL}/media/upload/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    // Пытаемся прочитать ответ как JSON
    let result: UploadAvatarResponse;
    try {
      result = await response.json();
    } catch {
      // Если не удалось распарсить JSON, обрабатываем по статусу
      let errorMessage = "Произошла ошибка при загрузке аватара";
      if (response.status === 400) {
        errorMessage = "Неверный формат файла или данные запроса";
      } else if (response.status === 401) {
        errorMessage = "Требуется авторизация";
      } else if (response.status === 413) {
        errorMessage = "Файл слишком большой";
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
      let errorMessage =
        result.error || "Произошла ошибка при загрузке аватара";
      if (!result.error) {
        if (response.status === 400) {
          errorMessage = "Неверный формат файла или данные запроса";
        } else if (response.status === 401) {
          errorMessage = "Требуется авторизация";
        } else if (response.status === 413) {
          errorMessage = "Файл слишком большой";
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

// Типы для треков
export interface TrackMetadata {
  duration?: number; // секунды
  bitrate?: number;
  format?: string;
}

export interface TrackFile {
  fileId: string;
  userId: string;
  type: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  metadata?: TrackMetadata;
  createdAt: string;
}

export interface UploadTrackResponse {
  success: boolean;
  file?: TrackFile;
  error?: string;
}

export interface GetUserTracksResponse {
  success: boolean;
  data?: TrackFile[];
  error?: string;
}

/**
 * Загружает аудио трек
 * @param file - Аудио файл для загрузки
 * @param userId - UUID пользователя
 * @returns Promise с результатом загрузки и данными трека
 */
export async function uploadTrack(
  file: File,
  userId: string
): Promise<UploadTrackResponse> {
  try {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      return {
        success: false,
        error: "Требуется авторизация",
      };
    }

    // Проверяем тип файла
    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/wave",
      "audio/ogg",
      "audio/m4a",
      "audio/x-m4a",
    ];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Неподдерживаемый формат файла. Используйте MP3, WAV, OGG или M4A",
      };
    }

    // Создаем FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);
    formData.append("type", "track");

    const response = await fetch(`${API_BASE_URL}/media/upload/track`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    // Пытаемся прочитать ответ как JSON
    let result: UploadTrackResponse;
    try {
      result = await response.json();
    } catch {
      // Если не удалось распарсить JSON, обрабатываем по статусу
      let errorMessage = "Произошла ошибка при загрузке трека";
      if (response.status === 400) {
        errorMessage = "Неверный формат файла или данные запроса";
      } else if (response.status === 401) {
        errorMessage = "Требуется авторизация";
      } else if (response.status === 413) {
        errorMessage = "Файл слишком большой";
      } else if (response.status === 429) {
        errorMessage = "Превышен лимит запросов. Попробуйте позже";
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
      let errorMessage =
        result.error || "Произошла ошибка при загрузке трека";
      if (!result.error) {
        if (response.status === 400) {
          errorMessage = "Неверный формат файла или данные запроса";
        } else if (response.status === 401) {
          errorMessage = "Требуется авторизация";
        } else if (response.status === 413) {
          errorMessage = "Файл слишком большой";
        } else if (response.status === 429) {
          errorMessage = "Превышен лимит запросов. Попробуйте позже";
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
 * Получает список треков пользователя
 * @param username - Username пользователя
 * @returns Promise со списком треков
 */
export async function getUserTracks(
  username: string
): Promise<GetUserTracksResponse> {
  try {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      return {
        success: false,
        error: "Требуется авторизация",
      };
    }

    const response = await fetch(
      `${API_BASE_URL}/users/${username}/tracks`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Пытаемся прочитать ответ как JSON
    let result: GetUserTracksResponse;
    try {
      const jsonData = await response.json();
      // API возвращает { success: true, data: [...] }
      result = jsonData;
    } catch {
      // Если не удалось распарсить JSON, обрабатываем по статусу
      let errorMessage = "Произошла ошибка при получении треков";
      if (response.status === 401) {
        errorMessage = "Требуется авторизация";
      } else if (response.status === 404) {
        errorMessage = "Пользователь не найден";
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
      let errorMessage =
        result.error || "Произошла ошибка при получении треков";
      if (!result.error) {
        if (response.status === 401) {
          errorMessage = "Требуется авторизация";
        } else if (response.status === 404) {
          errorMessage = "Пользователь не найден";
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
