import { API_BASE_URL, makeAuthorizedRequest, ApiResponse } from "./api";

/**
 * Подписывается на пользователя
 * @param userId - ID пользователя, на которого подписываются
 * @param followerId - ID пользователя, который подписывается
 * @returns Promise с результатом подписки
 */
export interface FollowResponse extends ApiResponse {
  data?: {
    _id: string;
    followerId: string;
    followingId: string;
    createdAt: string;
  };
}

export async function followUser(
  userId: string,
  followerId: string
): Promise<FollowResponse> {
  return makeAuthorizedRequest<FollowResponse>(
    `${API_BASE_URL}/social/follow/${userId}`,
    {
      method: "POST",
      body: JSON.stringify({ followerId }),
      errorHandlers: {
        400: "Неверный запрос",
        404: "Пользователь не найден",
      },
      defaultErrorMessage: "Произошла ошибка при подписке",
    }
  );
}

/**
 * Отписывается от пользователя
 * @param userId - ID пользователя, от которого отписываются
 * @param followerId - ID пользователя, который отписывается
 * @returns Promise с результатом отписки
 */
export type UnfollowResponse = ApiResponse;

export async function unfollowUser(
  userId: string,
  followerId: string
): Promise<UnfollowResponse> {
  return makeAuthorizedRequest<UnfollowResponse>(
    `${API_BASE_URL}/social/unfollow/${userId}`,
    {
      method: "POST",
      body: JSON.stringify({ followerId }),
      errorHandlers: {
        400: "Неверный запрос",
        404: "Пользователь не найден",
      },
      defaultErrorMessage: "Произошла ошибка при отписке",
    }
  );
}

/**
 * Проверяет, подписан ли один пользователь на другого
 * @param followerId - ID пользователя, который может быть подписан
 * @param followingId - ID пользователя, на которого может быть подписка
 * @returns Promise с результатом проверки
 */
export interface IsFollowingResponse extends ApiResponse {
  data?: {
    isFollowing: boolean;
  };
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<IsFollowingResponse> {
  return makeAuthorizedRequest<IsFollowingResponse>(
    `${API_BASE_URL}/social/isFollowing/${followerId}/${followingId}`,
    {
      method: "GET",
      errorHandlers: {
        404: "Пользователь не найден",
      },
      defaultErrorMessage: "Произошла ошибка при проверке подписки",
    }
  );
}

