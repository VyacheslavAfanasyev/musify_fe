"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = "http://localhost:3000";

interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  role: "musician" | "listener" | "";
}

interface ApiResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
  error?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    username: "",
    password: "",
    role: "",
  });
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Валидация
    if (!formData.email || !formData.username || !formData.password) {
      setError("Все поля обязательны для заполнения");
      setIsLoading(false);
      return;
    }

    if (!formData.role) {
      setError("Пожалуйста, выберите роль");
      setIsLoading(false);
      return;
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Введите корректный email адрес");
      setIsLoading(false);
      return;
    }

    // Валидация пароля (минимум 6 символов)
    if (formData.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          role: formData.role,
        }),
      });

      // Пытаемся прочитать ответ как JSON
      let data: ApiResponse;
      try {
        data = await response.json();
      } catch {
        // Если не удалось распарсить JSON, обрабатываем по статусу
        let errorMessage = "Произошла ошибка при регистрации";
        if (response.status === 404) {
          errorMessage = "Пользователь не найден";
        } else if (response.status === 400) {
          errorMessage = "Неверные данные для регистрации";
        } else if (response.status === 409) {
          errorMessage =
            "Пользователь с таким email или username уже существует";
        } else if (response.status >= 500) {
          errorMessage = "Ошибка сервера. Попробуйте позже";
        }
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Проверяем статус ответа и данные
      if (!response.ok || !data.success) {
        // Используем сообщение об ошибке из ответа или по статусу
        let errorMessage = data.error || "Произошла ошибка при регистрации";
        if (!data.error) {
          if (response.status === 404) {
            errorMessage = "Пользователь не найден";
          } else if (response.status === 400) {
            errorMessage = "Неверные данные для регистрации";
          } else if (response.status === 409) {
            errorMessage =
              "Пользователь с таким email или username уже существует";
          } else if (response.status >= 500) {
            errorMessage = "Ошибка сервера. Попробуйте позже";
          }
        }
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Успешная регистрация
      if (data.user) {
        // Перенаправляем на страницу входа
        router.push("/login?registered=true");
      }
    } catch (err) {
      // Обрабатываем только реальные сетевые ошибки
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Ошибка сети. Проверьте подключение к интернету.");
      } else {
        setError("Произошла неожиданная ошибка. Попробуйте позже.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="w-full max-w-md px-6 py-12">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-800">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-2">
            Регистрация
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            Создайте аккаунт, чтобы начать использовать PET
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-colors"
                placeholder="user@example.com"
                disabled={isLoading}
              />
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Имя пользователя
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-colors"
                placeholder="johndoe"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Пароль
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-colors"
                placeholder="Минимум 6 символов"
                disabled={isLoading}
              />
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Роль
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-colors"
                disabled={isLoading}
              >
                <option value="">Выберите роль</option>
                <option value="musician">Музыкант</option>
                <option value="listener">Слушатель</option>
              </select>
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
              {isLoading ? "Регистрация..." : "Зарегистрироваться"}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Уже есть аккаунт?{" "}
              <a
                href="/login"
                className="font-medium text-zinc-950 dark:text-zinc-50 hover:underline"
              >
                Войти
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
