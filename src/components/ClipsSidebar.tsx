"use client";

import {
  Search, MoreVertical, LayoutGrid, FileText,
  Play, Download, Loader2, Mic, RefreshCw, X,
} from "lucide-react";
import { useVideoEditor } from "@/contexts/VideoEditorContext";
import { useState, useCallback, useRef, useEffect } from "react";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

function useClipExport() {
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const stopRef = useRef(false);

  const exportClip = useCallback(async (
    clipId: string, startTime: number, endTime: number, title: string, videoUrl: string
  ) => {
    if (exportingId) return;
    setExportingId(clipId);
    setProgress(0);
    stopRef.current = false;

    const safeName = title.replace(/[^a-z0-9]/gi, "_");

    try {
      setProgress(10);
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime, endTime, filename: safeName }),
      });
      if (res.ok) {
        setProgress(90);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${safeName}.mp4`; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setExportingId(null); setProgress(0);
        return;
      }
      const data = await res.json();
      if (data.error !== "ffmpeg_not_found") throw new Error(data.error);
    } catch (e) {
      console.warn("Server export failed, using browser fallback:", e);
    }

    const duration = endTime - startTime;
    await new Promise<void>((resolve) => {
      const video = document.createElement("video");
      video.src = videoUrl; video.muted = true; video.crossOrigin = "anonymous"; video.preload = "auto";
      video.addEventListener("canplay", () => { video.currentTime = startTime; }, { once: true });
      video.addEventListener("seeked", () => {
        // @ts-ignore
        const stream: MediaStream = video.captureStream();
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = `${safeName}.webm`; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          setExportingId(null); setProgress(0); resolve();
        };
        recorder.start(100); video.play();
        const tick = setInterval(() => {
          const elapsed = video.currentTime - startTime;
          setProgress(Math.min(99, Math.round((elapsed / duration) * 100)));
          if (video.currentTime >= endTime || stopRef.current) {
            clearInterval(tick); video.pause(); recorder.stop();
          }
        }, 200);
      }, { once: true });
      video.load();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { exportClip, exportingId, progress };
}

type TranscriptSegment = {
  _id: string;
  start: number;
  end: number;
  text: string;
  speaker?: string;
  confidence: number;
};

function generateMockTranscript(duration: number): TranscriptSegment[] {
  const SAMPLE_LINES = [
    "Welcome to the match. Today we have an exciting game.",
    "The players are warming up on the field.",
    "The referee blows the whistle and the game begins.",
    "A quick pass down the left flank.",
    "The defender intercepts and clears it upfield.",
    "Great teamwork from the midfield today.",
    "The crowd is going wild with that last play.",
    "A free kick is awarded just outside the box.",
    "The striker lines up... and shoots!",
    "What a save by the goalkeeper!",
    "Corner kick coming up now.",
    "The ball is crossed into the penalty area.",
    "Header attempt — just over the bar.",
    "The game is very physical in the midfield.",
    "Yellow card shown to number seven.",
    "The substitution is being made now.",
    "Brilliant individual play from the winger.",
    "And that is the end of the first half.",
    "Second half underway. Both teams looking fresh.",
    "A counter-attack is building up quickly.",
    "The through ball is perfectly timed.",
    "GOAL! The striker slots it home!",
    "Incredible celebrations from the fans.",
    "The opposition pushes forward for an equaliser.",
    "Corner taken short and played in.",
    "The clearance falls to the edge of the box.",
    "Long range effort — straight at the keeper.",
    "Just five minutes remaining now.",
    "The referee checks his watch.",
    "And there is the final whistle!",
  ];
  const segDur = duration / SAMPLE_LINES.length;
  return SAMPLE_LINES.map((text, i) => ({
    _id: `ts_${i}`,
    start: parseFloat((i * segDur).toFixed(1)),
    end: parseFloat(((i + 1) * segDur - 0.2).toFixed(1)),
    text,
    speaker: i % 2 === 0 ? "Commentator 1" : "Commentator 2",
    confidence: parseFloat((0.88 + Math.random() * 0.12).toFixed(2)),
  }));
}

export function ClipsSidebar() {
  const { seekTo, setMarkIn, setMarkOut, videoRef, duration, videoUrl, clips } = useVideoEditor();
  const { exportClip, exportingId, progress } = useClipExport();

  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [activeTab, setActiveTab] = useState<"clips" | "transcript">("clips");
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  const currentTime = videoRef.current?.currentTime ?? 0;
  useEffect(() => {
    if (activeTab !== "transcript" || transcript.length === 0) return;
    const active = transcript.find((s) => currentTime >= s.start && currentTime <= s.end);
    if (active) setActiveSegmentId(active._id);
  }, [currentTime, transcript, activeTab]);

  const handleClipClick = (clip: typeof clips[number]) => {
    setActiveClipId(clip._id);
    setMarkIn(clip.startTime);
    setMarkOut(clip.endTime);
    seekTo(clip.startTime);
    setTimeout(() => { videoRef.current?.play(); }, 100);
  };

  const handleGenerateTranscript = async () => {
    if (generating) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 2500));
    setTranscript(generateMockTranscript(duration || 1720));
    setGenerating(false);
  };

  const filteredClips = clips.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTranscript = transcript.filter((s) =>
    s.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-gray-200">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(["clips", "transcript"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSearchQuery(""); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 border-b-2 font-medium text-sm transition-all duration-200 cursor-pointer capitalize
              ${activeTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"}`}
          >
            {tab === "clips" ? <LayoutGrid className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            <span>{tab}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder={activeTab === "clips" ? "Search clips…" : "Search transcript…"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-md py-2 pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white transition-all"
          />
          {searchQuery
            ? <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            : <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          }
        </div>
      </div>

      {/* Clips Tab */}
      {activeTab === "clips" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredClips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{searchQuery ? "No matching clips" : "No clips yet"}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery ? "Try a different search" : <>Set Mark In &amp; Mark Out,<br />then hit <strong>Create Clip</strong>.</>}
                </p>
              </div>
            </div>
          ) : (
            [...filteredClips].reverse().map((clip) => {
              const isActive = activeClipId === clip._id;
              const isExporting = exportingId === clip._id;
              return (
                <div
                  key={clip._id}
                  onClick={() => handleClipClick(clip)}
                  className={`flex space-x-3 group cursor-pointer p-2 rounded-lg transition-all border ${
                    isActive ? "bg-indigo-50 border-indigo-200 shadow-sm" : "hover:bg-gray-50 border-transparent hover:border-gray-100"
                  }`}
                >
                  <div className="relative w-24 h-16 rounded-md overflow-hidden flex-shrink-0 border border-gray-100 bg-gray-800">
                    {clip.thumbnail
                      ? <img src={clip.thumbnail} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-800 flex items-center justify-center"><span className="text-xs text-white/40">Clip</span></div>
                    }
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-mono">
                      {formatTime(clip.endTime - clip.startTime)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-semibold text-gray-900 truncate pr-1 leading-tight">{clip.title}</h4>
                      <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs text-gray-500">Status:</span>
                      <span className={`text-xs font-medium ${clip.status === "Ready" ? "text-green-600" : "text-orange-500"}`}>{clip.status}</span>
                      {clip.status === "Ready" && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">{formatTime(clip.startTime)} → {formatTime(clip.endTime)}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); exportClip(clip._id, clip.startTime, clip.endTime, clip.title, videoUrl); }}
                      disabled={!!exportingId}
                      className={`mt-1 flex items-center space-x-1 text-[11px] font-medium rounded px-2 py-0.5 w-fit transition-all
                        ${isExporting ? "bg-indigo-100 text-indigo-600 cursor-wait" : "bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40"}`}
                    >
                      {isExporting
                        ? <><Loader2 className="w-3 h-3 animate-spin" /><span>Exporting {progress}%</span></>
                        : <><Download className="w-3 h-3" /><span>Export MP4</span></>}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Transcript Tab */}
      {activeTab === "transcript" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {transcript.length > 0 ? `${transcript.length} segments` : "No transcript yet"}
            </span>
            <div className="flex items-center space-x-2">
              {transcript.length > 0 && (
                <button onClick={() => setTranscript([])} className="text-[11px] text-red-400 hover:text-red-600 transition-colors">
                  Clear
                </button>
              )}
              <button
                onClick={handleGenerateTranscript}
                disabled={generating}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors disabled:opacity-60"
              >
                {generating
                  ? <><Loader2 className="w-3 h-3 animate-spin" /><span>Generating…</span></>
                  : transcript.length > 0
                    ? <><RefreshCw className="w-3 h-3" /><span>Regenerate</span></>
                    : <><Mic className="w-3 h-3" /><span>Generate</span></>}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {generating && (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm text-gray-500">Generating transcript…</p>
                <p className="text-xs text-gray-400">Analysing audio track</p>
              </div>
            )}

            {!generating && transcript.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">No transcript</p>
                  <p className="text-xs text-gray-400 mt-1">Click <strong>Generate</strong> to create<br />a timecoded transcript.</p>
                </div>
              </div>
            )}

            {!generating && filteredTranscript.map((seg) => {
              const isActive = activeSegmentId === seg._id;
              return (
                <div
                  key={seg._id}
                  onClick={() => { seekTo(seg.start); videoRef.current?.play(); }}
                  className={`group cursor-pointer p-2 rounded-lg transition-all border ${
                    isActive ? "bg-indigo-50 border-indigo-200" : "hover:bg-gray-50 border-transparent hover:border-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-mono text-indigo-500 font-semibold">
                      {formatTime(seg.start)} → {formatTime(seg.end)}
                    </span>
                    {seg.speaker && (
                      <span className="text-[10px] text-gray-400 truncate max-w-[80px]">{seg.speaker}</span>
                    )}
                  </div>
                  <p className={`text-xs leading-relaxed ${isActive ? "text-gray-900 font-medium" : "text-gray-700"}`}>
                    {searchQuery
                      ? seg.text.split(new RegExp(`(${searchQuery})`, "gi")).map((part, i) =>
                          part.toLowerCase() === searchQuery.toLowerCase()
                            ? <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">{part}</mark>
                            : part
                        )
                      : seg.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
