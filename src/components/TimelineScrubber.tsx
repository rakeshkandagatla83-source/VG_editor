"use client";

import { Plus, Minus } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useVideoEditor } from "@/contexts/VideoEditorContext";

function formatTimecode(secs: number): string {
  if (!isFinite(secs) || isNaN(secs) || secs < 0) secs = 0;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function formatTimecodeMs(secs: number): string {
  if (!isFinite(secs) || isNaN(secs) || secs < 0) secs = 0;
  const m  = Math.floor(secs / 60);
  const s  = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 100);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}:${String(ms).padStart(2,'0')}`;
}

export function TimelineScrubber() {
  const { currentTime, duration, seekTo, markIn, markOut, segments, setMarkIn, setMarkOut, videoUrl } = useVideoEditor();
  const [thumbnails, setThumbnails]         = useState<string[]>([]);
  const [zoomLevel, setZoomLevel]           = useState(1);
  const [viewStart, setViewStart]           = useState(0);
  const [draggingEdge, setDraggingEdge]     = useState<"in" | "out" | null>(null);
  const [isScrubbing, setIsScrubbing]       = useState(false);
  const [isHoveringPlayhead, setIsHoveringPlayhead] = useState(false);

  const thumbVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const scrollRef     = useRef<HTMLDivElement>(null);
  const scaledRef     = useRef<HTMLDivElement>(null);

  const NUM_THUMBNAILS = 20;

  // ── Derived ──────────────────────────────────────────────────────────────
  const maxZoom      = duration > 0 ? Math.max(1, Math.floor(duration / Math.min(60, duration))) : 1;
  const viewDuration = duration > 0 ? duration / zoomLevel : 0;
  const viewEnd      = Math.min(duration, viewStart + viewDuration);

  const fullPct       = (t: number) => (duration > 0 ? (t / duration) * 100 : 0);
  const playheadLeft  = fullPct(currentTime);

  // Only compute selection coords when user has explicitly set them
  const hasMarkIn  = markIn !== null;
  const hasMarkOut = markOut !== null;
  const markInVal  = markIn  ?? 0;
  const markOutVal = markOut ?? duration;
  const selLeft    = fullPct(markInVal);
  const selRight   = fullPct(markOutVal);
  const selWidth   = selRight - selLeft;

  // ── Scroll sync ──────────────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || duration === 0) return;
    const scrollable = el.scrollWidth - el.clientWidth;
    if (scrollable <= 0) { setViewStart(0); return; }
    const pct = el.scrollLeft / scrollable;
    setViewStart(pct * (duration - viewDuration));
  }, [duration, viewDuration]);

  const scrollToTime = useCallback((t: number) => {
    const el = scrollRef.current;
    if (!el || duration === 0 || viewDuration === 0) return;
    const maxStart = Math.max(0, duration - viewDuration);
    if (maxStart <= 0) { el.scrollLeft = 0; return; }
    const pct = Math.max(0, Math.min(1, t / maxStart));
    el.scrollLeft = pct * (el.scrollWidth - el.clientWidth);
  }, [duration, viewDuration]);

  // ── Scrubbing ────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el || duration === 0) return;
    setIsScrubbing(true);
    const updateTime = (clientX: number) => {
      const rect = el.getBoundingClientRect();
      const posInFull = el.scrollLeft + (clientX - rect.left);
      const pct = Math.max(0, Math.min(1, posInFull / el.scrollWidth));
      seekTo(pct * duration);
    };
    updateTime(e.clientX);
    const onMove = (mv: MouseEvent) => updateTime(mv.clientX);
    const onUp   = () => {
      setIsScrubbing(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [duration, seekTo]);

  // ── Edge-handle drag (mark in / out) — with tooltip state ────────────────
  const handleEdgeDrag = useCallback((edge: "left" | "right", e: React.MouseEvent) => {
    e.stopPropagation();
    const el = scrollRef.current;
    if (!el || duration === 0) return;
    setDraggingEdge(edge === "left" ? "in" : "out");
    const staticBound = edge === "left" ? (markOut ?? duration) : (markIn ?? 0);
    const onMove = (mv: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const posInFull = el.scrollLeft + (mv.clientX - rect.left);
      const t = Math.max(0, Math.min(duration, (posInFull / el.scrollWidth) * duration));
      if (edge === "left") setMarkIn(Math.min(t, staticBound - 0.1));
      else setMarkOut(Math.max(t, staticBound + 0.1));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setDraggingEdge(null);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [duration, markIn, markOut, setMarkIn, setMarkOut]);

  // ── Zoom ─────────────────────────────────────────────────────────────────
  const zoom = useCallback((dir: "in" | "out") => {
    setZoomLevel(prev => {
      const step = Math.max(1, Math.round(prev * 0.4));
      const next = dir === "in" ? Math.min(maxZoom, prev + step) : Math.max(1, prev - step);
      if (next === prev) return prev;
      const newViewDur = duration / next;
      const centeredStart = Math.max(0, Math.min(duration - newViewDur, currentTime - newViewDur / 2));
      setTimeout(() => scrollToTime(centeredStart), 0);
      return next;
    });
  }, [maxZoom, duration, currentTime, scrollToTime]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (duration === 0 || viewDuration === 0) return;
    if (currentTime < viewStart || currentTime > viewEnd - viewDuration * 0.05) {
      scrollToTime(Math.max(0, currentTime - viewDuration * 0.2));
    }
  }, [currentTime]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Thumbnail extraction ──────────────────────────────────────────────────
  useEffect(() => {
    const video = thumbVideoRef.current;
    if (!video) return;
    let idx = 0; const frames: string[] = [];
    const capture = () => {
      const c = canvasRef.current; if (!c || !video) return;
      c.width = 160; c.height = 90;
      const ctx = c.getContext("2d");
      if (ctx) { ctx.drawImage(video, 0, 0, 160, 90); frames.push(c.toDataURL("image/jpeg", 0.6)); }
      idx++;
      if (idx < NUM_THUMBNAILS) video.currentTime = (video.duration / NUM_THUMBNAILS) * idx;
      else setThumbnails([...frames]);
    };
    const start = () => { if (video.duration && isFinite(video.duration)) { idx = 0; frames.length = 0; video.currentTime = 0.5; } };
    video.addEventListener("loadedmetadata", start);
    video.addEventListener("seeked", capture);
    if (video.readyState >= 1 && video.duration) start();
    return () => { video.removeEventListener("loadedmetadata", start); video.removeEventListener("seeked", capture); };
  }, []);

  // ── Adaptive time markers ─────────────────────────────────────────────────
  const niceIntervals = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  const rawInterval = viewDuration > 0 ? viewDuration / 12 : 10; // aim for ~12 markers
  const markerInterval = niceIntervals.find(n => n >= rawInterval) ?? 600;
  const timeMarkers: { pct: number; label: string; isMajor: boolean }[] = [];
  if (duration > 0 && viewDuration > 0) {
    // Major markers at markerInterval, minor ticks at markerInterval/5 (or /2)
    const minorInterval = markerInterval >= 10 ? markerInterval / 5 : markerInterval / 2;
    const firstTick = Math.floor(viewStart / minorInterval) * minorInterval;
    for (let t = firstTick; t <= viewEnd + minorInterval; t += minorInterval) {
      if (t < 0 || t > duration) continue;
      const isMajor = Math.abs(t % markerInterval) < 0.001 || Math.abs(t % markerInterval - markerInterval) < 0.001;
      timeMarkers.push({ pct: fullPct(t), label: formatTimecode(t), isMajor });
    }
  }

  // ── Minimap ───────────────────────────────────────────────────────────────
  const minimapRef = useRef<HTMLDivElement>(null);
  const thumbLeft  = duration > 0 ? (viewStart  / duration) * 100 : 0;
  const thumbWidth = duration > 0 ? (viewDuration / duration) * 100 : 100;

  const handleMinimapDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const mm = minimapRef.current;
    if (!mm || duration === 0) return;
    const update = (clientX: number) => {
      const rect = mm.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const maxStart = Math.max(0, duration - viewDuration);
      scrollToTime(pct * maxStart);
    };
    update(e.clientX);
    const onMove = (mv: MouseEvent) => update(mv.clientX);
    const onUp   = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [duration, viewDuration, scrollToTime]);

  const STRIP_HEIGHT = 72; // px — matches h-[72px] on the strip
  const RULER_HEIGHT = 24; // px — matches h-6 on the ruler

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col mt-3 select-none">
      <video ref={thumbVideoRef} src={videoUrl || undefined} className="hidden" muted preload="auto" crossOrigin="anonymous" />
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Scroll container ──────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto scrollbar-hide"
        onScroll={handleScroll}
      >
        <div ref={scaledRef} className="relative" style={{ width: `${zoomLevel * 100}%`, minWidth: "100%" }}>

          {/* ── Time Ruler ──────────────────────────────────────────── */}
          <div className="relative w-full h-6 mb-0.5">
            {/* Adaptive time markers — major ticks with labels, minor ticks without */}
            {timeMarkers.map(({ pct, label, isMajor }, i) => (
              <div
                key={i}
                className="absolute flex flex-col items-center pointer-events-none"
                style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
              >
                {isMajor && (
                  <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap leading-none">{label}</span>
                )}
                <div
                  className={`w-px ${isMajor ? 'h-2.5 bg-gray-300' : 'h-1.5 bg-gray-200'}`}
                  style={{ marginTop: isMajor ? '1px' : '11px' }}
                />
              </div>
            ))}

            {/* Mark IN ruler marker — only when explicitly set */}
            {hasMarkIn && (
              <div
                className="absolute top-0 flex flex-col items-center pointer-events-none z-20"
                style={{ left: `${selLeft}%`, transform: "translateX(-50%)" }}
              >
                <div className="rounded-sm px-1 text-[9px] font-bold leading-none py-0.5 mb-0.5" style={{ background: "#6366f1", color: "#fff" }}>IN</div>
                <div className="w-px h-2" style={{ background: "#6366f1" }} />
              </div>
            )}

            {/* Mark OUT ruler marker — only when explicitly set */}
            {hasMarkOut && (
              <div
                className="absolute top-0 flex flex-col items-center pointer-events-none z-20"
                style={{ left: `${selRight}%`, transform: "translateX(-50%)" }}
              >
                <div className="rounded-sm px-1 text-[9px] font-bold leading-none py-0.5 mb-0.5" style={{ background: "#6366f1", color: "#fff" }}>OUT</div>
                <div className="w-px h-2" style={{ background: "#6366f1" }} />
              </div>
            )}
          </div>

          {/* ── Thumbnail strip ─────────────────────────────────────── */}
          <div
            className="relative w-full rounded-lg bg-[#1a2535] border border-gray-700 overflow-visible cursor-crosshair"
            style={{ height: `${STRIP_HEIGHT}px` }}
            onMouseDown={handleMouseDown}
          >
            {/* Frames — fixed 120px-wide cells, mapped to nearest pre-extracted thumbnail */}
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              {(() => {
                const el = scrollRef.current;
                const containerW = el ? el.clientWidth : 800;
                const totalW = containerW * zoomLevel;
                const CELL_W = 120; // fixed pixel width per thumbnail cell
                const cellCount = Math.max(NUM_THUMBNAILS, Math.ceil(totalW / CELL_W));
                const cellWidthPct = 100 / cellCount;
                return Array.from({ length: cellCount }).map((_, i) => {
                  // Map this cell to the nearest pre-extracted thumbnail
                  const cellTime = (i / cellCount) * duration;
                  const thumbIdx = Math.min(
                    NUM_THUMBNAILS - 1,
                    Math.round((cellTime / duration) * NUM_THUMBNAILS)
                  );
                  return (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-r border-[#2d3f55] overflow-hidden pointer-events-none"
                      style={{ left: `${i * cellWidthPct}%`, width: `${cellWidthPct}%` }}
                    >
                      {thumbnails[thumbIdx]
                        ? <img src={thumbnails[thumbIdx]} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-[#243044] animate-pulse" />}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Committed segment overlays (green) */}
            {segments.map(seg => (
              <div
                key={seg.id}
                className="absolute top-0 bottom-0 border-2 border-emerald-400 bg-emerald-400/25 z-10 pointer-events-none"
                style={{ left: `${fullPct(seg.start)}%`, width: `${fullPct(seg.end) - fullPct(seg.start)}%` }}
              />
            ))}

            {/* ── Active Mark In/Out selection — only when both set ──── */}
            {hasMarkIn && hasMarkOut && selWidth > 0.01 && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{
                  left: `${selLeft}%`,
                  width: `${selWidth}%`,
                  background: "rgba(245,158,11,0.12)",
                  borderTop: "2px solid #6366f1",
                  borderBottom: "2px solid #6366f1",
                }}
              />
            )}

            {/* ── Mark IN handle — only when set ─────────────── */}
            {hasMarkIn && (
              <div
                className="absolute top-0 bottom-0 z-30 group pointer-events-auto"
                style={{ left: `${selLeft}%` }}
                onMouseDown={e => handleEdgeDrag("left", e)}
              >
                {/* Timecode tooltip — shows while dragging */}
                {draggingEdge === "in" && (
                  <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white whitespace-nowrap shadow-lg z-50 pointer-events-none"
                    style={{ background: "#6366f1" }}
                  >
                    {formatTimecodeMs(markIn)}
                  </div>
                )}

                {/* Handle body — left [  bracket shape */}
                <div
                  className="absolute top-0 bottom-0 flex flex-col items-start cursor-ew-resize"
                  style={{
                    width: "14px",
                    transform: "translateX(-50%)",
                    background: "#6366f1",
                    borderRadius: "3px 0 0 3px",
                    boxShadow: "2px 0 8px rgba(245,158,11,0.4)",
                  }}
                >
                  {/* Grip lines */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-1 w-full">
                    <div className="w-1 h-1 rounded-full bg-white/70" />
                    <div className="w-1 h-1 rounded-full bg-white/70" />
                    <div className="w-1 h-1 rounded-full bg-white/70" />
                  </div>
                  {/* Top & bottom horizontal tick marks — L-bracket feel */}
                  <div className="absolute top-0 left-0 h-[3px] w-5 rounded-br" style={{ background: "#6366f1" }} />
                  <div className="absolute bottom-0 left-0 h-[3px] w-5 rounded-tr" style={{ background: "#6366f1" }} />
                </div>
              </div>
            )}

            {/* ── Mark OUT handle — only when set ──────────── */}
            {hasMarkOut && (
              <div
                className="absolute top-0 bottom-0 z-30 group pointer-events-auto"
                style={{ left: `${selRight}%` }}
                onMouseDown={e => handleEdgeDrag("right", e)}
              >
                {/* Timecode tooltip */}
                {draggingEdge === "out" && (
                  <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white whitespace-nowrap shadow-lg z-50 pointer-events-none"
                    style={{ background: "#6366f1" }}
                  >
                    {formatTimecodeMs(markOut)}
                  </div>
                )}

                {/* Handle body — right ] bracket shape */}
                <div
                  className="absolute top-0 bottom-0 flex flex-col items-end cursor-ew-resize"
                  style={{
                    width: "14px",
                    transform: "translateX(-50%)",
                    background: "#6366f1",
                    borderRadius: "0 3px 3px 0",
                    boxShadow: "-2px 0 8px rgba(245,158,11,0.4)",
                  }}
                >
                  <div className="flex-1 flex flex-col items-center justify-center gap-1 w-full">
                    <div className="w-1 h-1 rounded-full bg-white/70" />
                    <div className="w-1 h-1 rounded-full bg-white/70" />
                    <div className="w-1 h-1 rounded-full bg-white/70" />
                  </div>
                  <div className="absolute top-0 right-0 h-[3px] w-5 rounded-bl" style={{ background: "#6366f1" }} />
                  <div className="absolute bottom-0 right-0 h-[3px] w-5 rounded-tl" style={{ background: "#6366f1" }} />
                </div>
              </div>
            )}
          </div>

          {/* ── Playhead ─────────────────────────────────────────── */}
          {/* Transparent hover zone — pointer-events-auto so hover is detected */}
          <div
            className="absolute top-0 bottom-0 z-40 cursor-ew-resize"
            style={{ left: `${playheadLeft}%`, width: "20px", transform: "translateX(-50%)" }}
            onMouseEnter={() => setIsHoveringPlayhead(true)}
            onMouseLeave={() => setIsHoveringPlayhead(false)}
          />

          {/* Visual playhead — pointer-events-none */}
          <div
            className="absolute top-0 z-50 pointer-events-none"
            style={{ left: `${playheadLeft}%`, bottom: 0, transform: "translateX(-50%)" }}
          >
            {/* Timecode pill — shown on hover or scrub, fades with transition */}
            <div
              className="absolute font-mono font-bold text-white text-[10px] whitespace-nowrap px-1.5 py-0.5 rounded select-none transition-opacity duration-150"
              style={{
                background: "rgba(239,68,68,0.92)",
                top: "3px",
                left: "50%",
                transform: "translateX(-50%)",
                boxShadow: "0 1px 6px rgba(0,0,0,0.35)",
                letterSpacing: "0.02em",
                zIndex: 60,
                opacity: isScrubbing || isHoveringPlayhead ? 1 : 0,
                pointerEvents: "none",
              }}
            >
              {formatTimecodeMs(currentTime)}
            </div>

            {/* Triangle */}
            <svg
              width="14" height="12" viewBox="0 0 14 12"
              className="fill-red-500 drop-shadow-md"
              style={{ position: "absolute", top: "-4px", left: "0" }}
            >
              <polygon points="0,0 14,0 7,12" />
            </svg>
            {/* Stem */}
            <div
              className="absolute left-[6px] top-0 bottom-0 w-[2px] bg-red-500"
              style={{ boxShadow: "0 0 4px rgba(239,68,68,0.5)" }}
            />
          </div>

        </div>
      </div>

      {/* ── Minimap row ──────────────────────────────────────────── */}
      <div className="flex items-center space-x-2 mt-2">
        <span className="text-[10px] font-mono text-gray-400 flex-shrink-0 w-[44px]">
          {formatTimecode(viewStart)}
        </span>

        <div
          ref={minimapRef}
          className="flex-1 h-3 bg-gray-100 border border-gray-200 rounded-full relative cursor-pointer overflow-hidden"
          onMouseDown={handleMinimapDrag}
        >
          {/* Mark In/Out region on minimap — only when set */}
          {hasMarkIn && hasMarkOut && selWidth > 0 && (
            <div
              className="absolute top-0 bottom-0 opacity-60 pointer-events-none"
              style={{
                left: `${((markIn ?? 0) / duration) * 100}%`,
                width: `${(((markOut ?? 0) - (markIn ?? 0)) / duration) * 100}%`,
                background: "#6366f1",
              }}
            />
          )}
          {segments.map(seg => (
            <div
              key={seg.id}
              className="absolute top-0 bottom-0 bg-emerald-400 opacity-50 pointer-events-none"
              style={{ left: `${(seg.start / duration) * 100}%`, width: `${((seg.end - seg.start) / duration) * 100}%` }}
            />
          ))}
          {/* Viewport thumb */}
          <div
            className="absolute top-0 bottom-0 bg-indigo-500 rounded-full opacity-75 hover:opacity-100 transition-opacity cursor-grab"
            style={{ left: `${thumbLeft}%`, width: `${Math.max(thumbWidth, 4)}%` }}
          />
        </div>

        <span className="text-[10px] font-mono text-gray-400 flex-shrink-0 w-[44px] text-right">
          {formatTimecode(viewEnd)}
        </span>

        <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
        <span className="text-[10px] font-mono text-gray-500 flex-shrink-0 min-w-[30px] text-center">{zoomLevel}×</span>

        <button
          onClick={() => zoom("out")} disabled={zoomLevel <= 1}
          className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-3 h-3 text-gray-600" />
        </button>
        <button
          onClick={() => zoom("in")} disabled={zoomLevel >= maxZoom}
          className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Zoom In"
        >
          <Plus className="w-3 h-3 text-gray-600" />
        </button>
      </div>

      {/* ── Footer: duration info + IN/OUT markers ─────────────── */}
      <div className="flex items-center justify-between text-[11px] mt-1.5 pt-1.5 border-t border-gray-100">
        {/* Total duration only — current time now floats above playhead */}
        <div className="flex items-center space-x-1 font-mono text-gray-400">
          <span className="text-gray-500">Duration:</span>
          <span>{formatTimecode(duration)}</span>
        </div>

        {/* IN/OUT readout — only shown when marks are set */}
        <div className="flex items-center space-x-2 font-mono text-[10px]">
          {hasMarkIn && (
            <div className="flex items-center space-x-1">
              <span className="px-1 py-0.5 rounded text-[9px] font-bold text-white leading-none" style={{ background: "#6366f1" }}>IN</span>
              <span className="text-gray-600">{formatTimecodeMs(markInVal)}</span>
            </div>
          )}
          {hasMarkIn && hasMarkOut && <span className="text-gray-300">→</span>}
          {hasMarkOut && (
            <div className="flex items-center space-x-1">
              <span className="px-1 py-0.5 rounded text-[9px] font-bold text-white leading-none" style={{ background: "#6366f1" }}>OUT</span>
              <span className="text-gray-600">{formatTimecodeMs(markOutVal)}</span>
            </div>
          )}
          {hasMarkIn && hasMarkOut && (
            <span className="text-gray-400 ml-1">({formatTimecode(markOutVal - markInVal)})</span>
          )}
        </div>

        <span className="text-gray-400 text-[10px]">Visible: {formatTimecode(viewDuration)}</span>
      </div>
    </div>
  );
}
