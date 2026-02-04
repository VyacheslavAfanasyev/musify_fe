"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface CurrentTrack {
  trackId: string;
  trackName: string;
  duration?: number;
}

interface VolumeContextType {
  volume: number;
  setVolume: (volume: number) => void;
  currentTrack: CurrentTrack | null;
  setCurrentTrack: (track: CurrentTrack | null) => void;
}

const VolumeContext = createContext<VolumeContextType | undefined>(undefined);

export function VolumeProvider({ children }: { children: ReactNode }) {
  const [volume, setVolume] = useState(1.0);
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);

  return (
    <VolumeContext.Provider
      value={{ volume, setVolume, currentTrack, setCurrentTrack }}
    >
      {children}
    </VolumeContext.Provider>
  );
}

export function useVolume() {
  const context = useContext(VolumeContext);
  if (context === undefined) {
    throw new Error("useVolume must be used within a VolumeProvider");
  }
  return context;
}
