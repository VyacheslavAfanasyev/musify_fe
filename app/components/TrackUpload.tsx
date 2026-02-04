"use client";

import { useState, useRef } from "react";
import { uploadTrack, TrackFile } from "@/lib/media";

interface TrackUploadProps {
  userId: string;
  onUploadSuccess?: (track: TrackFile) => void;
}

export default function TrackUpload({
  userId,
  onUploadSuccess,
}: TrackUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");
    setUploadSuccess(false);

    try {
      const result = await uploadTrack(file, userId);
      if (!result.success || !result.file) {
        setUploadError(result.error || "Не удалось загрузить трек");
        setIsUploading(false);
        return;
      }

      setUploadSuccess(true);
      if (onUploadSuccess) {
        onUploadSuccess(result.file);
      }

      // Очищаем input для возможности повторной загрузки
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Скрываем сообщение об успехе через 3 секунды
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    } catch {
      setUploadError("Произошла неожиданная ошибка. Попробуйте позже.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
        Загрузить трек
      </h2>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/ogg,audio/m4a,audio/x-m4a"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleButtonClick}
        disabled={isUploading}
        className="w-full py-3 px-4 rounded-lg bg-foreground text-background font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Загрузка...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Выбрать аудио файл
          </>
        )}
      </button>

      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 text-center">
        Поддерживаемые форматы: MP3, WAV, OGG, M4A
      </p>

      {uploadError && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">
            {uploadError}
          </p>
        </div>
      )}

      {uploadSuccess && (
        <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">
            Трек успешно загружен!
          </p>
        </div>
      )}
    </div>
  );
}

