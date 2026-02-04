"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, UserProfile, logoutUser } from "@/lib/auth";
import {
  uploadAvatar,
  getAvatarUrl,
  getUserAudioFiles,
  TrackFile,
} from "@/lib/media";
import Image from "next/image";
import TrackUpload from "@/app/components/TrackUpload";
import AudioPlayer from "@/app/components/AudioPlayer";
import { VolumeProvider } from "@/app/components/VolumeContext";
import FloatingPlayer from "@/app/components/FloatingPlayer";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [avatarVersion, setAvatarVersion] = useState<number>(0);
  const [tracks, setTracks] = useState<TrackFile[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      // Проверяем наличие userId в localStorage
      if (typeof window === "undefined") return;

      const userId = localStorage.getItem("userId");
      if (!userId) {
        router.push("/login");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const result = await getUserProfile(userId);
        if (!result.success || !result.user) {
          setError(result.error || "Не удалось загрузить профиль");
          setIsLoading(false);
          return;
        }

        setProfile(result.user);
        setAvatarError(false);

        // Загружаем треки пользователя
        if (result.user.username) {
          loadTracks(result.user.username);
        }
      } catch {
        setError("Произошла неожиданная ошибка. Попробуйте позже.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const loadTracks = async (username: string) => {
    setIsLoadingTracks(true);
    try {
      const result = await getUserAudioFiles(username);
      if (result.success && result.audioFiles) {
        setTracks(result.audioFiles);
      }
    } catch {
      // Игнорируем ошибки загрузки аудиофайлов, чтобы не блокировать страницу
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleTrackUploadSuccess = (track: TrackFile) => {
    // Добавляем новый трек в список
    setTracks((prev) => [track, ...prev]);

    // Обновляем счетчик треков в профиле
    if (profile) {
      setProfile({
        ...profile,
        stats: {
          tracksCount: (profile.stats?.tracksCount || 0) + 1,
          followersCount: profile.stats?.followersCount || 0,
          followingCount: profile.stats?.followingCount || 0,
          totalPlays: profile.stats?.totalPlays || 0,
        },
      });
    }

    // Перезагружаем профиль для получения актуальных данных
    const userId = localStorage.getItem("userId");
    if (userId) {
      getUserProfile(userId).then((result) => {
        if (result.success && result.user) {
          setProfile(result.user);
        }
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push("/login");
    } catch (err) {
      console.error("Ошибка при выходе:", err);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const userId = localStorage.getItem("userId");
    if (!userId) {
      setUploadError("Пользователь не найден");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const result = await uploadAvatar(file, userId);
      if (!result.success || !result.file) {
        setUploadError(result.error || "Не удалось загрузить аватар");
        setIsUploading(false);
        return;
      }

      // Обновляем профиль с новым URL аватара
      if (profile) {
        setProfile({
          ...profile,
          avatarUrl: result.file.url,
        });
      }

      // Перезагружаем профиль для получения актуальных данных
      const profileResult = await getUserProfile(userId);
      if (profileResult.success && profileResult.user) {
        setProfile(profileResult.user);
        setAvatarError(false);
        setAvatarVersion((prev) => prev + 1);
      }
    } catch {
      setUploadError("Произошла неожиданная ошибка. Попробуйте позже.");
    } finally {
      setIsUploading(false);
      // Очищаем input для возможности повторной загрузки того же файла
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 px-4 rounded-lg bg-foreground text-background font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
            >
              Вернуться к входу
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <VolumeProvider>
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black pb-20">
        {/* Cover Image */}
        <div className="relative h-64 w-full bg-gradient-to-r from-zinc-800 to-zinc-900 dark:from-zinc-900 dark:to-black">
          {profile.coverImageUrl ? (
            <Image
              src={profile.coverImageUrl}
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
                <div
                  className="relative w-32 h-32 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group"
                  onClick={handleAvatarClick}
                >
                  {!avatarError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`avatar-${profile.userId}-${avatarVersion}`}
                      src={`${getAvatarUrl(profile.userId)}?v=${avatarVersion}`}
                      alt={profile.displayName || profile.username}
                      className="w-full h-full object-cover"
                      onError={() => {
                        // Если аватар не найден, показываем инициал
                        setAvatarError(true);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-semibold text-zinc-500 dark:text-zinc-400">
                      {(profile.displayName ||
                        profile.username)[0].toUpperCase()}
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-sm">Загрузка...</div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                      Изменить
                    </span>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {uploadError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center max-w-32">
                    {uploadError}
                  </p>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                  <div>
                    <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-1">
                      {profile.displayName || profile.username}
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                      @{profile.username}
                    </p>
                    {profile.bio && (
                      <p className="text-zinc-700 dark:text-zinc-300 mb-2">
                        {profile.bio}
                      </p>
                    )}
                    {profile.location && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-500">
                        📍 {profile.location}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors whitespace-nowrap"
                  >
                    Выйти
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          {profile.stats && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                <div className="text-2xl font-bold text-black dark:text-zinc-50">
                  {profile.stats.tracksCount || 0}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Треков
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                <div className="text-2xl font-bold text-black dark:text-zinc-50">
                  {profile.stats.followersCount || 0}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Подписчиков
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                <div className="text-2xl font-bold text-black dark:text-zinc-50">
                  {profile.stats.followingCount || 0}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Подписок
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                <div className="text-2xl font-bold text-black dark:text-zinc-50">
                  {profile.stats.totalPlays || 0}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Прослушиваний
                </div>
              </div>
            </div>
          )}

          {/* Genres and Instruments */}
          {(profile.genres && profile.genres.length > 0) ||
          (profile.instruments && profile.instruments.length > 0) ? (
            <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-6">
              {profile.genres && profile.genres.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-2">
                    Жанры
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.genres.map((genre, index) => (
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
              {profile.instruments && profile.instruments.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-2">
                    Инструменты
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.instruments.map((instrument, index) => (
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
          {profile.socialLinks &&
            (profile.socialLinks.youtube ||
              profile.socialLinks.vk ||
              profile.socialLinks.telegram) && (
              <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
                  Социальные сети
                </h2>
                <div className="flex flex-wrap gap-4">
                  {profile.socialLinks.youtube && (
                    <a
                      href={profile.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 dark:text-red-400 hover:underline"
                    >
                      YouTube
                    </a>
                  )}
                  {profile.socialLinks.vk && (
                    <a
                      href={profile.socialLinks.vk}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      VK
                    </a>
                  )}
                  {profile.socialLinks.telegram && (
                    <a
                      href={`https://t.me/${profile.socialLinks.telegram.replace(
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-1">
                  Роль
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 capitalize">
                  {profile.role === "musician" ? "Музыкант" : "Слушатель"}
                </p>
              </div>
              <a
                href="/change-password"
                className="px-4 py-2 rounded-lg bg-foreground text-background font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
              >
                Изменить пароль
              </a>
            </div>
          </div>

          {/* Tracks Section */}
          <div className="mt-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-black dark:text-zinc-50">
                Мои треки
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

            {/* Track Upload */}
            <div className="mb-6">
              <TrackUpload
                userId={profile.userId}
                onUploadSuccess={handleTrackUploadSuccess}
              />
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
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-8 text-center">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Загрузите свой первый трек, чтобы начать делиться музыкой!
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
