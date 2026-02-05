"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllUsers, UserProfile } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/media";
import Link from "next/link";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [avatarErrors, setAvatarErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadUsers = async () => {
      if (typeof window === "undefined") return;

      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        router.push("/login");
        return;
      }

      // Получаем текущий userId для исключения из списка
      const currentUserId = localStorage.getItem("userId");

      setIsLoading(true);
      setError("");

      try {
        const result = await getAllUsers(currentUserId || undefined);
        if (!result.success || !result.profiles) {
          setError(result.error || "Не удалось загрузить список пользователей");
          setIsLoading(false);
          return;
        }

        setUsers(result.profiles);
      } catch {
        setError("Произошла неожиданная ошибка. Попробуйте позже.");
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [router]);

  const handleAvatarError = (userId: string) => {
    setAvatarErrors((prev) => new Set(prev).add(userId));
  };

  const handleUserClick = (username: string) => {
    router.push(`/users/${username}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            Загрузка пользователей...
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
              onClick={() => router.push("/profile")}
              className="w-full py-3 px-4 rounded-lg bg-foreground text-background font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
            >
              Вернуться в профиль
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
              Пользователи
            </h1>
            <Link
              href="/profile"
              className="px-4 py-2 rounded-lg bg-foreground text-background font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
            >
              Мой профиль
            </Link>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Найдите музыкантов и слушателей для подписки и прослушивания треков
          </p>
        </div>

        {/* Users Grid */}
        {users.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div
                key={user.userId}
                onClick={() => handleUserClick(user.username)}
                className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-6 cursor-pointer hover:shadow-lg transition-shadow hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="relative w-16 h-16 rounded-full border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      {!avatarErrors.has(user.userId) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getAvatarUrl(user.userId)}
                          alt={user.displayName || user.username}
                          className="w-full h-full object-cover"
                          onError={() => handleAvatarError(user.userId)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-zinc-500 dark:text-zinc-400">
                          {(user.displayName || user.username)[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-black dark:text-zinc-50 truncate">
                      {user.displayName || user.username}
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                    {user.location && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                        📍 {user.location}
                      </p>
                    )}

                    {/* Stats */}
                    {user.stats && (
                      <div className="flex gap-4 mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                        <span>
                          <strong className="text-black dark:text-zinc-50">
                            {user.stats.tracksCount || 0}
                          </strong>{" "}
                          треков
                        </span>
                        <span>
                          <strong className="text-black dark:text-zinc-50">
                            {user.stats.followersCount || 0}
                          </strong>{" "}
                          подписчиков
                        </span>
                      </div>
                    )}

                    {/* Role Badge */}
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {user.role === "musician" ? "Музыкант" : "Слушатель"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              Пользователи не найдены
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

