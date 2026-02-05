"use client";

import { useState, useRef, useEffect } from "react";
import { getTrackUrl } from "@/lib/media";
import { useVolume } from "./VolumeContext";

interface AudioPlayerProps {
  trackId: string;
  trackName: string;
  duration?: number;
  onDelete?: (trackId: string) => void;
  showDeleteButton?: boolean;
}

export default function AudioPlayer({
  trackId,
  trackName,
  duration,
  onDelete,
  showDeleteButton = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const { volume, setCurrentTrack } = useVolume();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (!isSeeking) {
        setCurrentTime(audio.currentTime);
      }
    };
    const updateDuration = () => setTotalDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTrack(null);
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePause = () => {
      setIsPlaying(false);
      // Если это текущий трек, очищаем его при паузе (опционально, можно оставить)
      // setCurrentTrack(null);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [setCurrentTrack, isSeeking]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Останавливаем все другие аудио элементы
      const allAudioElements = document.querySelectorAll("audio");
      allAudioElements.forEach((el) => {
        if (el !== audio) {
          el.pause();
        }
      });

      // Устанавливаем текущий трек в контекст
      setCurrentTrack({
        trackId,
        trackName,
        duration: totalDuration || duration,
      });

      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setSeekTime(newTime);
    // Обновляем только визуальное состояние во время перетаскивания
    if (isSeeking) {
      setCurrentTime(newTime);
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
    setSeekTime(currentTime);
  };

  const handleSeekEnd = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Обновляем audio.currentTime только когда пользователь отпустил ползунок
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
    setIsSeeking(false);
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Используем seekTime для визуального отображения во время перетаскивания
  const displayTime = isSeeking ? seekTime : currentTime;
  const progress = totalDuration > 0 ? (displayTime / totalDuration) * 100 : 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 p-4">
      <audio ref={audioRef} src={getTrackUrl(trackId)} preload="metadata" />

      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <svg
              className="animate-spin h-6 w-6"
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
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg
              className="w-6 h-6 ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Track Info and Progress */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-black dark:text-zinc-50 truncate mb-1">
            {trackName}
          </p>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max={totalDuration || 0}
              value={displayTime}
              onChange={handleSeek}
              onMouseDown={handleSeekStart}
              onMouseUp={handleSeekEnd}
              onTouchStart={handleSeekStart}
              onTouchEnd={handleSeekEnd}
              className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-foreground"
              style={{
                background: `linear-gradient(to right, var(--foreground) 0%, var(--foreground) ${progress}%, rgb(228 228 231) ${progress}%, rgb(228 228 231) 100%)`,
              }}
            />
            <div className="flex-shrink-0 text-xs text-zinc-600 dark:text-zinc-400 min-w-[80px] text-right">
              {formatTime(displayTime)} / {formatTime(totalDuration)}
            </div>
          </div>
        </div>

        {/* Delete Button */}
        {showDeleteButton && onDelete && (
          <button
            onClick={() => onDelete(trackId)}
            className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"
            aria-label="Удалить трек"
            title="Удалить трек"
          >
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
