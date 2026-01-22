const API_BASE_URL = "http://localhost:3000";

/**
 * Получает URL аватара пользователя
 * @param userId - UUID пользователя
 * @returns URL для получения аватара
 */
export function getAvatarUrl(userId: string): string {
  return `${API_BASE_URL}/media/avatar/${userId}`;
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
