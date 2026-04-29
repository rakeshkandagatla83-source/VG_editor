"use client";

import { Play, Pause, Volume2, VolumeX, Camera, Plus, Minus, Trash2, SkipBack, SkipForward, ChevronRight, Film } from "lucide-react";
import { useVideoEditor } from "@/contexts/VideoEditorContext";

export function TimelineControls() {
  const {
    isPlaying, togglePlayPause, seekBy, duration,
    playbackRate, setPlaybackRate, volume, setVolume, currentTime,
    markIn, setMarkIn, markOut, setMarkOut, videoRef,
    segments, addSegment, removeSegment, clearSegments, videoId, addClip,
  } = useVideoEditor();

  const captureFrame = (): string => {
    const video = videoRef.current;
    if (!video) return "";
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 320; canvas.height = 180;
      canvas.getContext("2d")?.drawImage(video, 0, 0, 320, 180);
      return canvas.toDataURL("image/jpeg", 0.75);
    } catch { return ""; }
  };

  const handleCreateClip = () => {
    const thumbnail = captureFrame();
    if (segments.length > 0) {
      const earliestStart = Math.min(...segments.map((s) => s.start));
      const latestEnd = Math.max(...segments.map((s) => s.end));
      addClip({
        videoId: videoId ?? "mock",
        title: `Multi-Segment Clip (${segments.length}) - ${new Date().toLocaleTimeString()}`,
        startTime: earliestStart,
        endTime: latestEnd,
        thumbnail,
      });
      clearSegments();
    } else {
      addClip({
        videoId: videoId ?? "mock",
        title: `Clip ${new Date().toLocaleTimeString()}`,
        startTime: markIn ?? 0,
        endTime: markOut ?? duration,
        thumbnail,
      });
    }
  };

  const handleAddSegment = () => {
    addSegment(markIn ?? 0, markOut ?? duration);
  };

  const handleRemoveLastSegment = () => {
    if (segments.length > 0) removeSegment(segments[segments.length - 1].id);
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) timeInSeconds = 0;
    const m = Math.floor(timeInSeconds / 60).toString().padStart(2, "0");
    const s = Math.floor(timeInSeconds % 60).toString().padStart(2, "0");
    const ms = Math.floor((timeInSeconds % 1) * 100).toString().padStart(2, "0");
    return `${m}:${s}:${ms}`;
  };

  return (
    <div className="w-full bg-white border-b border-gray-100 flex items-center justify-between px-4 py-2.5">
      {/* Left: play controls */}
      <div className="flex items-center space-x-3">
        <button onClick={() => seekBy(-5)} className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors cursor-pointer" title="-5s">
          <SkipBack className="w-5 h-5" />
        </button>
        <button onClick={togglePlayPause} className="p-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95">
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
        </button>
        <button onClick={() => seekBy(5)} className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors cursor-pointer" title="+5s">
          <SkipForward className="w-5 h-5" />
        </button>

        <div className="h-6 w-[1px] bg-gray-200 mx-2" />

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setPlaybackRate(playbackRate >= 2 ? 0.5 : playbackRate + 0.5)}
            className="text-sm font-medium text-gray-600 hover:text-indigo-600 min-w-[3ch] transition-colors"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>
          <button onClick={() => setVolume(volume > 0 ? 0 : 1)} className="text-gray-600 hover:text-indigo-600 transition-colors">
            {volume > 0 ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Center: trim controls */}
      <div className="flex items-center space-x-1.5">
        <button
          onClick={() => setMarkIn(currentTime)}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
          title="Set Mark In at current time"
        >
          <span className="text-base leading-none font-bold text-indigo-500">[</span>
          <span>IN</span>
        </button>

        <div className="flex items-stretch rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex divide-x divide-gray-100">
            <button className="px-2.5 py-1.5 hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors flex items-center" title="Snapshot">
              <Camera className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleAddSegment} className="px-2.5 py-1.5 hover:bg-emerald-50 text-emerald-600 transition-colors flex items-center" title="Add Segment">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRemoveLastSegment}
              disabled={segments.length === 0}
              className={`px-2.5 py-1.5 flex items-center transition-colors ${segments.length === 0 ? "opacity-40 cursor-not-allowed text-gray-400" : "hover:bg-red-50 text-red-500 hover:text-red-600"}`}
              title="Remove Last Segment"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setMarkIn(null); setMarkOut(null); clearSegments(); }}
              className="px-2.5 py-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex items-center"
              title="Clear All"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setMarkOut(currentTime)}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
          title="Set Mark Out at current time"
        >
          <span>OUT</span>
          <span className="text-base leading-none font-bold text-indigo-500">]</span>
        </button>
      </div>

      {/* Right: create clip */}
      <div>
        <button
          onClick={handleCreateClip}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md group"
        >
          <Film className="w-4 h-4" />
          <span>{segments.length > 0 ? `Create Clip (${segments.length})` : "Create Clip"}</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform opacity-70" />
        </button>
      </div>
    </div>
  );
}
