"use client";

import { useVolume } from "./VolumeContext";
import { useEffect, useState } from "react";

export default function FloatingPlayer() {
  const { volume, setVolume, currentTrack } = useVolume();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Синхронизация с аудио элементом текущего трека
  useEffect(() => {
    if (!currentTrack) {
      // Используем setTimeout для асинхронного обновления состояния
      const timer = setTimeout(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setTotalDuration(0);
      }, 0);
      return () => clearTimeout(timer);
    }

    // Находим все audio элементы на странице и находим нужный
    const allAudioElements = document.querySelectorAll("audio");
    let targetAudio: HTMLAudioElement | null = null;

    for (let i = 0; i < allAudioElements.length; i++) {
      const element = allAudioElements[i];
      if (
        element instanceof HTMLAudioElement &&
        element.src.includes(currentTrack.trackId)
      ) {
        targetAudio = element;
        break;
      }
    }

    if (!targetAudio) return;

    const updateTime = () => setCurrentTime(targetAudio!.currentTime);
    const updateDuration = () => setTotalDuration(targetAudio!.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    targetAudio.addEventListener("timeupdate", updateTime);
    targetAudio.addEventListener("loadedmetadata", updateDuration);
    targetAudio.addEventListener("play", handlePlay);
    targetAudio.addEventListener("pause", handlePause);
    targetAudio.addEventListener("ended", handleEnded);
    targetAudio.addEventListener("loadstart", handleLoadStart);
    targetAudio.addEventListener("canplay", handleCanPlay);

    // Обновляем состояние при монтировании асинхронно
    const initTimer = setTimeout(() => {
      setIsPlaying(!targetAudio.paused);
      setCurrentTime(targetAudio.currentTime);
      if (targetAudio.duration) {
        setTotalDuration(targetAudio.duration);
      }
    }, 0);

    return () => {
      clearTimeout(initTimer);
      if (targetAudio) {
        targetAudio.removeEventListener("timeupdate", updateTime);
        targetAudio.removeEventListener("loadedmetadata", updateDuration);
        targetAudio.removeEventListener("play", handlePlay);
        targetAudio.removeEventListener("pause", handlePause);
        targetAudio.removeEventListener("ended", handleEnded);
        targetAudio.removeEventListener("loadstart", handleLoadStart);
        targetAudio.removeEventListener("canplay", handleCanPlay);
      }
    };
  }, [currentTrack]);

  const togglePlay = () => {
    if (!currentTrack) return;

    const allAudioElements = document.querySelectorAll("audio");
    let targetAudio: HTMLAudioElement | null = null;

    for (let i = 0; i < allAudioElements.length; i++) {
      const element = allAudioElements[i];
      if (
        element instanceof HTMLAudioElement &&
        element.src.includes(currentTrack.trackId)
      ) {
        targetAudio = element;
        break;
      }
    }

    if (!targetAudio) return;

    // Останавливаем все другие аудио
    for (let i = 0; i < allAudioElements.length; i++) {
      const element = allAudioElements[i];
      if (element instanceof HTMLAudioElement && element !== targetAudio) {
        element.pause();
      }
    }

    if (isPlaying) {
      targetAudio.pause();
    } else {
      targetAudio.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentTrack) return;

    const allAudioElements = document.querySelectorAll("audio");
    let targetAudio: HTMLAudioElement | null = null;

    for (let i = 0; i < allAudioElements.length; i++) {
      const element = allAudioElements[i];
      if (
        element instanceof HTMLAudioElement &&
        element.src.includes(currentTrack.trackId)
      ) {
        targetAudio = element;
        break;
      }
    }

    if (!targetAudio) return;

    const newTime = parseFloat(e.target.value);
    targetAudio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentTrack) {
    return null;
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-black dark:text-zinc-50 truncate">
              {currentTrack.trackName}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min="0"
                max={totalDuration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-foreground"
                style={{
                  background: `linear-gradient(to right, var(--foreground) 0%, var(--foreground) ${progress}%, rgb(228 228 231) ${progress}%, rgb(228 228 231) 100%)`,
                }}
              />
              <div className="flex-shrink-0 text-xs text-zinc-600 dark:text-zinc-400 min-w-[80px] text-right">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </div>
            </div>
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
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
            ) : isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 ml-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <svg
              className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {volume === 0 ? (
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              ) : volume < 0.5 ? (
                <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
              ) : (
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              )}
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-foreground"
              style={{
                background: `linear-gradient(to right, var(--foreground) 0%, var(--foreground) ${
                  volume * 100
                }%, rgb(228 228 231) ${volume * 100}%, rgb(228 228 231) 100%)`,
              }}
              aria-label="Volume"
            />
            <span className="text-xs text-zinc-600 dark:text-zinc-400 min-w-[35px] text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
