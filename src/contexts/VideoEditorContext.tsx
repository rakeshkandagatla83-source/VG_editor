"use client";

import React, { createContext, useContext, useRef, useState, useEffect, ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export interface GeneratedClip {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  status: string;
  createdAt: number;
}

export interface SegmentType {
  id: string;            // Convex doc ID used for removal
  _id?: string;
  start: number;
  end: number;
}

interface VideoEditorContextType {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  togglePlayPause: () => void;
  seekBy: (seconds: number) => void;
  seekTo: (seconds: number) => void;
  markIn: number | null;
  setMarkIn: (time: number | null) => void;
  markOut: number | null;
  setMarkOut: (time: number | null) => void;
  clips: GeneratedClip[];
  addGeneratedClip: (clip: Omit<GeneratedClip, "id" | "createdAt" | "status">) => void;
  segments: SegmentType[];
  addSegment: (start: number, end: number) => void;
  removeSegment: (id: string) => void;
  clearSegments: () => void;
  // Segment preview (EDL playback)
  isPreviewingSegments: boolean;
  previewSegmentIndex: number;
  startSegmentPreview: () => void;
  stopSegmentPreview: () => void;
  videoUrl: string;
  videoId: string | undefined;
}

const VideoEditorContext = createContext<VideoEditorContextType | undefined>(undefined);

export function VideoEditorProvider({ children, videoUrl, videoId }: { children: ReactNode; videoUrl?: string; videoId?: string }) {
  const resolvedVideoUrl = videoUrl ?? process.env.NEXT_PUBLIC_VIDEO_URL ?? "/master.mp4";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [markIn, setMarkIn]   = useState<number | null>(null);
  const [markOut, setMarkOut] = useState<number | null>(null);
  const [clips, setClips] = useState<GeneratedClip[]>([]);

  // ── Stable session ID (persists across refreshes) ──────────────────────
  const [sessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'ssr';
    const stored = localStorage.getItem('editor_session_id');
    if (stored) return stored;
    const id = Math.random().toString(36).slice(2);
    localStorage.setItem('editor_session_id', id);
    return id;
  });

  // ── Convex-backed segments ──────────────────────────────────────────────
  const convexSegments = useQuery(api.segments.getSegments, { sessionId });
  const addSegmentMut  = useMutation(api.segments.addSegment);
  const removeSegMut   = useMutation(api.segments.removeSegment);
  const clearSegMut    = useMutation(api.segments.clearSegments);

  // Map Convex docs to local SegmentType shape
  type SegmentDoc = NonNullable<typeof convexSegments>[number];
  const segments: SegmentType[] = (convexSegments ?? []).map((s: SegmentDoc) => ({
    id: s._id,
    _id: s._id,
    start: s.start,
    end: s.end,
  }));


  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekBy = (seconds: number) => {
    if (videoRef.current) {
      let newTime = videoRef.current.currentTime + seconds;
      if (newTime < 0) newTime = 0;
      if (newTime > duration) newTime = duration;
      videoRef.current.currentTime = newTime;
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds); // Optimistic visual update
    }
  };

  const addSegment = (start: number, end: number) => {
    addSegmentMut({ sessionId, start, end });
  };

  const removeSegment = (id: string) => {
    removeSegMut({ id: id as Id<"pendingSegments"> });
  };

  const clearSegments = () => clearSegMut({ sessionId });

  // ── Segment Preview (EDL playback) ────────────────────────────────────
  const [isPreviewingSegments, setIsPreviewingSegments] = useState(false);
  const [previewSegmentIndex, setPreviewSegmentIndex]   = useState(0);
  const previewActiveRef = useRef(false);   // ref avoids stale closure in event
  const seekingRef       = useRef(false);   // suppress false end-detection during seek

  const startSegmentPreview = () => {
    if (segments.length === 0) return;
    const sorted = [...segments].sort((a, b) => a.start - b.start);
    previewActiveRef.current = true;
    setIsPreviewingSegments(true);
    setPreviewSegmentIndex(0);
    seekingRef.current = true;
    if (videoRef.current) {
      videoRef.current.currentTime = sorted[0].start;
      videoRef.current.play();
      // Clear seeking flag after seek settles
      setTimeout(() => { seekingRef.current = false; }, 400);
    }
  };

  const stopSegmentPreview = () => {
    previewActiveRef.current = false;
    setIsPreviewingSegments(false);
    setPreviewSegmentIndex(0);
    videoRef.current?.pause();
  };

  // Watch currentTime and hop between segments
  useEffect(() => {
    if (!isPreviewingSegments || segments.length === 0 || seekingRef.current) return;
    const sorted = [...segments].sort((a, b) => a.start - b.start);
    const current = sorted[previewSegmentIndex];
    if (!current) { stopSegmentPreview(); return; }

    if (currentTime >= current.end - 0.15) {     // 150ms early to avoid audio pop
      const nextIdx = previewSegmentIndex + 1;
      if (nextIdx < sorted.length) {
        setPreviewSegmentIndex(nextIdx);
        seekingRef.current = true;
        if (videoRef.current) {
          videoRef.current.currentTime = sorted[nextIdx].start;
          setTimeout(() => { seekingRef.current = false; }, 400);
        }
      } else {
        stopSegmentPreview();   // All segments finished
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, isPreviewingSegments, previewSegmentIndex]);

  const addGeneratedClip = (newClip: Omit<GeneratedClip, "id" | "createdAt" | "status">) => {
    setClips(prev => [
      ...prev,
      {
        ...newClip,
        id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        status: "Processing",
      }
    ]);
    
    // Auto-update status to "Ready" after 3 seconds asynchronously to simulate processing
    setTimeout(() => {
      setClips(currentClips => 
        currentClips.map(c => 
          (c.title === newClip.title && c.startTime === newClip.startTime) 
            ? { ...c, status: "Ready" } 
            : c
        )
      );
    }, 2500);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.volume = volume;
    }
  }, [playbackRate, volume]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (videoRef.current) {
            if (videoRef.current.paused) videoRef.current.play();
            else videoRef.current.pause();
          }
          break;
        case 'KeyI':
          setMarkIn(videoRef.current?.currentTime ?? 0);
          break;
        case 'KeyO':
          setMarkOut(videoRef.current?.currentTime ?? 0);
          break;
        case 'KeyJ':
          e.preventDefault();
          if (videoRef.current) {
            const r = videoRef.current.playbackRate;
            videoRef.current.playbackRate = Math.max(0.25, r / 2);
            setPlaybackRate(videoRef.current.playbackRate);
          }
          break;
        case 'KeyK':
          if (videoRef.current) videoRef.current.pause();
          break;
        case 'KeyL':
          e.preventDefault();
          if (videoRef.current) {
            const r = videoRef.current.playbackRate;
            videoRef.current.playbackRate = Math.min(r * 2, 8);
            videoRef.current.play();
            setPlaybackRate(videoRef.current.playbackRate);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration, setMarkIn, setMarkOut, setPlaybackRate]);

  return (
    <VideoEditorContext.Provider
      value={{
        videoRef,
        isPlaying,
        setIsPlaying,
        currentTime,
        setCurrentTime,
        duration,
        setDuration,
        playbackRate,
        setPlaybackRate,
        volume,
        setVolume,
        togglePlayPause,
        seekBy,
        seekTo,
        markIn,
        setMarkIn,
        markOut,
        setMarkOut,
        clips,
        addGeneratedClip,
        segments,
        addSegment,
        removeSegment,
        clearSegments,
        isPreviewingSegments,
        previewSegmentIndex,
        startSegmentPreview,
        stopSegmentPreview,
        videoUrl: resolvedVideoUrl,
        videoId,
      }}
    >
      {children}
    </VideoEditorContext.Provider>
  );
}

export function useVideoEditor() {
  const context = useContext(VideoEditorContext);
  if (context === undefined) {
    throw new Error("useVideoEditor must be used within a VideoEditorProvider");
  }
  return context;
}
