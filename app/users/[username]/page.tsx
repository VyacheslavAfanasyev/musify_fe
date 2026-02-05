"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getPublicProfile,
  PublicProfile,
  
} from "@/lib/auth";
import { getAvatarUrl} from "@/lib/media";
import { followUser, unfollowUser } from "@/lib/social";
import { getUserAudioFiles, TrackFile } from "@/lib/media";
import Image from "next/image";
import AudioPlayer from "@/app/components/AudioPlayer";
import { VolumeProvider } from "@/app/components/VolumeContext";
import FloatingPlayer from "@/app/components/FloatingPlayer";
import Link from "next/link";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params?.username as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [avatarVersion] = useState<number>(0);
  const [tracks, setTracks] = useState<TrackFile[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);
  const [isFollowingUser, setIsFollowingUser] = useState<boolean>(false);
  const [isFollowLoading, setIsFollowLoading] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (typeof window === "undefined" || !username) return;

      const userId = localStorage.getItem("userId");
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        router.push("/login");
        return;
      }

      setCurrentUserId(userId);
      setIsLoading(true);
      setError("");

      try {
        const result = await getPublicProfile(username, userId || undefined);
        if (!result.success || !result.data) {
          setError(result.error || "Не удалось загрузить профиль");
          setIsLoading(false);
          return;
        }

        setProfile(result.data);
        setIsFollowingUser(result.data.isFollowing || false);
        setAvatarError(false);

        // Загружаем треки пользователя
        loadTracks(username);
      } catch {
        setError("Произошла неожиданная ошибка. Попробуйте позже.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [router, username]);

  const loadTracks = async (username: string) => {
    setIsLoadingTracks(true);
    try {
      const result = await getUserAudioFiles(username);
      if (result.success && result.audioFiles) {
        setTracks(result.audioFiles);
      }
    } catch {
      // Игнорируем ошибки загрузки аудиофайлов
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId || !profile) return;

    setIsFollowLoading(true);
    try {
      if (isFollowingUser) {
        // Отписка
        const result = await unfollowUser(profile.profile.userId, currentUserId);
        if (result.success) {
          setIsFollowingUser(false);
          // Обновляем счетчик подписчиков
          setProfile({
            ...profile,
            followersCount: Math.max(profile.followersCount - 1, 0),
            isFollowing: false,
          });
        } else {
          alert(result.error || "Не удалось отписаться");
        }
      } else {
        // Подписка
        const result = await followUser(profile.profile.userId, currentUserId);
        if (result.success) {
          setIsFollowingUser(true);
          // Обновляем счетчик подписчиков
          setProfile({
            ...profile,
            followersCount: profile.followersCount + 1,
            isFollowing: true,
          });
        } else {
          alert(result.error || "Не удалось подписаться");
        }
      }
    } catch (err) {
      console.error("Ошибка при подписке/отписке:", err);
      alert("Произошла ошибка. Попробуйте позже.");
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            Загрузка профиля...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="w-full max-w-md px-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-800">
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push("/users")}
                className="flex-1 py-3 px-4 rounded-lg bg-foreground text-background font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
              >
                К списку пользователей
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="flex-1 py-3 px-4 rounded-lg border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Мой профиль
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const userProfile = profile.profile;
  const isOwnProfile = profile.isOwnProfile || false;

  return (
    <VolumeProvider>
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black pb-20">
        {/* Cover Image */}
        <div className="relative h-64 w-full bg-gradient-to-r from-zinc-800 to-zinc-900 dark:from-zinc-900 dark:to-black">
          {userProfile.coverImageUrl ? (
            <Image
              src={userProfile.coverImageUrl}
              alt="Cover"
              fill
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pb-12">
          {/* Profile Header */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="relative w-32 h-32 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  {!avatarError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`avatar-${userProfile.userId}-${avatarVersion}`}
                      src={`${getAvatarUrl(userProfile.userId)}?v=${avatarVersion}`}
                      alt={userProfile.displayName || userProfile.username}
                      className="w-full h-full object-cover"
                      onError={() => {
                        setAvatarError(true);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-semibold text-zinc-500 dark:text-zinc-400">
                      {(userProfile.displayName ||
                        userProfile.username)[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-1">
                      {userProfile.displayName || userProfile.username}
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                      @{userProfile.username}
                    </p>
                    {userProfile.bio && (
                      <p className="text-zinc-700 dark:text-zinc-300 mb-2">
                        {userProfile.bio}
                      </p>
                    )}
                    {userProfile.location && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-500">
                        📍 {userProfile.location}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {!isOwnProfile && (
                      <button
                        onClick={handleFollow}
                        disabled={isFollowLoading}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                          isFollowingUser
                            ? "bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-50 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                            : "bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
                        } ${isFollowLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isFollowLoading
                          ? "Загрузка..."
                          : isFollowingUser
                          ? "Отписаться"
                          : "Подписаться"}
                      </button>
                    )}
                    <Link
                      href="/users"
                      className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
                    >
                      Назад
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          {userProfile.stats && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                <div className="text-2xl font-bold text-black dark:text-zinc-50">
                  {userProfile.stats.tracksCount || 0}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Треков
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                <div className="text-2xl font-bold text-black dark:text-zinc-50">
                  {profile.followersCount}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Подписчиков
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                <div className="text-2xl font-bold text-black dark:text-zinc-50">
                  {profile.followingCount}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Подписок
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                <div className="text-2xl font-bold text-black dark:text-zinc-50">
                  {userProfile.stats.totalPlays || 0}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Прослушиваний
                </div>
              </div>
            </div>
          )}

          {/* Genres and Instruments */}
          {(userProfile.genres && userProfile.genres.length > 0) ||
          (userProfile.instruments && userProfile.instruments.length > 0) ? (
            <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-6">
              {userProfile.genres && userProfile.genres.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-2">
                    Жанры
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.genres.map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {userProfile.instruments && userProfile.instruments.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-2">
                    Инструменты
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.instruments.map((instrument, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm"
                      >
                        {instrument}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Social Links */}
          {userProfile.socialLinks &&
            (userProfile.socialLinks.youtube ||
              userProfile.socialLinks.vk ||
              userProfile.socialLinks.telegram) && (
              <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
                  Социальные сети
                </h2>
                <div className="flex flex-wrap gap-4">
                  {userProfile.socialLinks.youtube && (
                    <a
                      href={userProfile.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 dark:text-red-400 hover:underline"
                    >
                      YouTube
                    </a>
                  )}
                  {userProfile.socialLinks.vk && (
                    <a
                      href={userProfile.socialLinks.vk}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      VK
                    </a>
                  )}
                  {userProfile.socialLinks.telegram && (
                    <a
                      href={`https://t.me/${userProfile.socialLinks.telegram.replace(
                        "@",
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 dark:text-blue-400 hover:underline"
                    >
                      Telegram
                    </a>
                  )}
                </div>
              </div>
            )}

          {/* Role */}
          <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-6">
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-1">
                Роль
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 capitalize">
                {userProfile.role === "musician" ? "Музыкант" : "Слушатель"}
              </p>
            </div>
          </div>

          {/* Tracks Section */}
          <div className="mt-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-black dark:text-zinc-50">
                Треки
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                {tracks.length > 0
                  ? `${tracks.length} ${
                      tracks.length === 1
                        ? "трек"
                        : tracks.length < 5
                        ? "трека"
                        : "треков"
                    }`
                  : "Пока нет загруженных треков"}
              </p>
            </div>

            {/* Tracks List */}
            {isLoadingTracks ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-8 text-center">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Загрузка треков...
                </p>
              </div>
            ) : tracks.length > 0 ? (
              <div className="space-y-4">
                {tracks.map((track) => (
                  <AudioPlayer
                    key={track.fileId}
                    trackId={track.fileId}
                    trackName={track.originalName.replace(/\.[^/.]+$/, "")}
                    duration={track.metadata?.duration}
                    showDeleteButton={false}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-8 text-center">
                <p className="text-zinc-600 dark:text-zinc-400">
                  У этого пользователя пока нет загруженных треков
                </p>
              </div>
            )}
          </div>
        </div>
        <FloatingPlayer />
      </div>
    </VolumeProvider>
  );
}

