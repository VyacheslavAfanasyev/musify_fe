"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { changePassword } from "@/lib/auth";

interface ChangePasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ChangePasswordFormData>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Используем ленивую инициализацию для чтения из localStorage
  const [userId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userId");
    }
    return null;
  });

  // Проверяем авторизацию и перенаправляем при необходимости
  useEffect(() => {
    if (!userId) {
      router.push("/login");
    }
  }, [userId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    // Валидация
    if (
      !formData.oldPassword ||
      !formData.newPassword ||
      !formData.confirmPassword
    ) {
      setError("Все поля обязательны для заполнения");
      setIsLoading(false);
      return;
    }

    // Валидация пароля (минимум 6 символов)
    if (formData.newPassword.length < 6) {
      setError("Новый пароль должен содержать минимум 6 символов");
      setIsLoading(false);
      return;
    }

    // Проверка совпадения нового пароля и подтверждения
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Новый пароль и подтверждение не совпадают");
      setIsLoading(false);
      return;
    }

    // Проверка, что новый пароль отличается от старого
    if (formData.oldPassword === formData.newPassword) {
      setError("Новый пароль должен отличаться от старого");
      setIsLoading(false);
      return;
    }

    if (!userId) {
      setError("Пользователь не авторизован");
      setIsLoading(false);
      return;
    }

    try {
      const result = await changePassword({
        userId: userId,
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      if (!result.success) {
        setError(result.error || "Произошла ошибка при смене пароля");
        setIsLoading(false);
        return;
      }

      // Успешная смена пароля
      setSuccessMessage("Пароль успешно изменен!");
      // Очищаем форму
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      // Перенаправляем на главную страницу через 2 секунды
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch {
      setError("Произошла неожиданная ошибка. Попробуйте позже.");
      setIsLoading(false);
    }
  };

  // Показываем загрузку, пока проверяем авторизацию
  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-zinc-600 dark:text-zinc-400">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="w-full max-w-md px-6 py-12">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-800">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-2">
            Смена пароля
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            Введите старый пароль и новый пароль для изменения
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success message */}
            {successMessage && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400">
                  {successMessage}
                </p>
              </div>
            )}

            {/* Old Password */}
            <div>
              <label
                htmlFor="oldPassword"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Старый пароль
              </label>
              <input
                type="password"
                id="oldPassword"
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-colors"
                placeholder="Введите старый пароль"
                disabled={isLoading}
              />
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Новый пароль
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-colors"
                placeholder="Минимум 6 символов"
                disabled={isLoading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Подтвердите новый пароль
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-colors"
                placeholder="Повторите новый пароль"
                disabled={isLoading}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-foreground text-background font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Изменение..." : "Изменить пароль"}
            </button>
          </form>

          {/* Back link */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-950 dark:text-zinc-50 hover:underline"
            >
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
