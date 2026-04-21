"use client";

import { useEffect } from "react";
import { Info } from "lucide-react";
import { useVideoEditor } from "@/contexts/VideoEditorContext";

export function VideoPlayer() {
  const { videoRef, currentTime, setCurrentTime, setDuration, isPlaying, setIsPlaying, videoUrl } = useVideoEditor();

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) timeInSeconds = 0;
    const h = Math.floor(timeInSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((timeInSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Ensure duration handles cached media loads that bypass onLoadedMetadata
  useEffect(() => {
    if (videoRef.current && videoRef.current.readyState >= 1) {
      setDuration(videoRef.current.duration);
    }
  }, [videoRef, setDuration]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden flex items-center justify-center border border-gray-100 shadow-sm">
      <video 
        ref={videoRef}
        src={videoUrl || undefined}
        className="w-full h-full object-contain"
        controls={false}
        preload="metadata"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onLoadedData={(e) => setDuration(e.currentTarget.duration)}
        onCanPlay={(e) => setDuration(e.currentTarget.duration)}
        onClick={() => {
          if (videoRef.current) {
            isPlaying ? videoRef.current.pause() : videoRef.current.play();
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {/* On-screen controls/overlay as seen in screenshot */}
      <div className="absolute bottom-4 right-4 flex items-center bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium space-x-2">
        <div className="w-2 h-2 rounded-full bg-red-500"></div>
        <span>{formatTime(currentTime)} Selected</span>
      </div>
    </div>
  );
}
