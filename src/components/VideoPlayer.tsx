"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { useVideoEditor } from "@/contexts/VideoEditorContext";

export function VideoPlayer() {
  const { videoRef, currentTime, setCurrentTime, setDuration, isPlaying, setIsPlaying, videoUrl } = useVideoEditor();

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) timeInSeconds = 0;
    const h = Math.floor(timeInSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((timeInSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((timeInSeconds % 1) * 100).toString().padStart(2, '0');
    return `${h}:${m}:${s}.${ms}`;
  };

  const [hasError, setHasError] = useState(false);
  const [mockCurrentTime, setMockCurrentTime] = useState(0);

  // Sync mock time to context when scrubbed
  useEffect(() => {
    setMockCurrentTime(currentTime);
  }, [currentTime]);

  // Simulated Playback Loop for Mock Video
  useEffect(() => {
    if (!hasError || !isPlaying) return;
    let lastTime = performance.now();
    let rafId: number;

    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      setMockCurrentTime((prev: number) => {
        const next = Math.min(prev + delta, 596); // Assuming ~596s mock duration
        setCurrentTime(next);
        if (next >= 596) setIsPlaying(false);
        return next;
      });
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [hasError, isPlaying, setCurrentTime, setIsPlaying]);

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
        className={`w-full h-full object-contain ${hasError ? 'hidden' : ''}`}
        controls={false}
        preload="metadata"
        onError={(e) => {
          console.warn("Video failed to load, falling back to Mock Video Player.");
          setHasError(true);
          setDuration(596); // Fallback mock duration
        }}
        onTimeUpdate={(e) => !hasError && setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => !hasError && setDuration(e.currentTarget.duration)}
        onLoadedData={(e) => !hasError && setDuration(e.currentTarget.duration)}
        onCanPlay={(e) => !hasError && setDuration(e.currentTarget.duration)}
        onClick={() => {
          if (hasError) {
            setIsPlaying(!isPlaying);
          } else if (videoRef.current) {
            // Safe play/pause to avoid NotSupportedError
            const p = isPlaying ? videoRef.current.pause() : videoRef.current.play();
            if (p instanceof Promise) p.catch(() => {});
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Mock Video Visualizer */}
      {hasError && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f1a] cursor-pointer"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          <div className="text-4xl font-mono text-indigo-400 mb-4 bg-[#1a1f2e] px-6 py-3 rounded-xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            {formatTime(mockCurrentTime)}
          </div>
          <p className="text-slate-400 font-medium tracking-widest uppercase text-sm">
            Mock Video Active
          </p>
          <p className="text-slate-500 text-xs mt-2">
            Click to {isPlaying ? "Pause" : "Play"}
          </p>
        </div>
      )}
      
      {/* On-screen controls/overlay as seen in screenshot */}
      <div className="absolute bottom-4 right-4 flex items-center bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium space-x-2">
        <div className="w-2 h-2 rounded-full bg-red-500"></div>
        <span>{formatTime(currentTime)} Selected</span>
      </div>
    </div>
  );
}
