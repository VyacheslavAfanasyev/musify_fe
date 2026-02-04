import { API_BASE_URL, makeAuthorizedRequest, ApiResponse } from "./api";

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

export interface UploadAvatarResponse extends ApiResponse {
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

  return makeAuthorizedRequest<UploadAvatarResponse>(
    `${API_BASE_URL}/media/upload/avatar`,
    {
      method: "POST",
      body: formData,
      errorHandlers: {
        400: "Неверный формат файла или данные запроса",
        413: "Файл слишком большой",
      },
      defaultErrorMessage: "Произошла ошибка при загрузке аватара",
    }
  );
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

export interface UploadTrackResponse extends ApiResponse {
  file?: TrackFile;
}

export interface GetUserTracksResponse extends ApiResponse {
  data?: TrackFile[];
}

export interface GetUserAudioFilesResponse extends ApiResponse {
  audioFiles?: TrackFile[];
}

export type DeleteTrackResponse = ApiResponse;

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

  return makeAuthorizedRequest<UploadTrackResponse>(
    `${API_BASE_URL}/media/upload/track`,
    {
      method: "POST",
      body: formData,
      errorHandlers: {
        400: "Неверный формат файла или данные запроса",
        413: "Файл слишком большой",
        429: "Превышен лимит запросов. Попробуйте позже",
      },
      defaultErrorMessage: "Произошла ошибка при загрузке трека",
    }
  );
}

/**
 * Получает список треков пользователя
 * @param username - Username пользователя
 * @returns Promise со списком треков
 */
export async function getUserTracks(
  username: string
): Promise<GetUserTracksResponse> {
  return makeAuthorizedRequest<GetUserTracksResponse>(
    `${API_BASE_URL}/users/${username}/tracks`,
    {
      method: "GET",
      errorHandlers: {
        404: "Пользователь не найден",
      },
      defaultErrorMessage: "Произошла ошибка при получении треков",
    }
  );
}

/**
 * Получает список всех аудиофайлов пользователя
 * @param username - Username пользователя
 * @returns Promise со списком всех аудиофайлов (включая треки и другие аудиофайлы)
 */
export async function getUserAudioFiles(
  username: string
): Promise<GetUserAudioFilesResponse> {
  return makeAuthorizedRequest<GetUserAudioFilesResponse>(
    `${API_BASE_URL}/users/${username}/audio-files`,
    {
      method: "GET",
      errorHandlers: {
        404: "Пользователь не найден",
      },
      defaultErrorMessage: "Произошла ошибка при получении аудиофайлов",
    }
  );
}

/**
 * Удаляет аудио трек
 * @param trackId - ID трека (fileId)
 * @returns Promise с результатом удаления
 */
export async function deleteTrack(
  trackId: string
): Promise<DeleteTrackResponse> {
  return makeAuthorizedRequest<DeleteTrackResponse>(
    `${API_BASE_URL}/media/track/${trackId}`,
    {
      method: "DELETE",
      errorHandlers: {
        404: "Трек не найден",
      },
      defaultErrorMessage: "Произошла ошибка при удалении трека",
    }
  );
}
