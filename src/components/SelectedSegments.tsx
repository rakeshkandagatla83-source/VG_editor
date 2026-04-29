"use client";

import { Trash2, PlayCircle, StopCircle, GitMerge } from "lucide-react";
import { useVideoEditor } from "@/contexts/VideoEditorContext";

export function SelectedSegments() {
  const {
    segments, removeSegment, clearSegments, addClip, videoId,
    isPreviewingSegments, previewSegmentIndex,
    startSegmentPreview, stopSegmentPreview,
  } = useVideoEditor();

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) timeInSeconds = 0;
    const m = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((timeInSeconds % 1) * 100).toString().padStart(2, '0');
    return `${m}:${s}:${ms}`;
  };

  const handleMerge = () => {
    if (segments.length === 0) return;
    const sorted = [...segments].sort((a, b) => a.start - b.start);
    const start = sorted[0].start;
    const end = sorted[sorted.length - 1].end;
    
    addClip({
      videoId: videoId || "unknown",
      title: `Merged Clip (${segments.length} segments)`,
      startTime: start,
      endTime: end,
      thumbnail: "",
    });
    clearSegments();
  };

  if (segments.length === 0) return null;

  return (
    <div className="w-full bg-gray-50 border-b border-gray-200 p-4 shrink-0 flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-gray-800">
            Selected Segments ({segments.length})
          </h3>
          <button
            onClick={isPreviewingSegments ? stopSegmentPreview : startSegmentPreview}
            className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-medium transition-all border ${
              isPreviewingSegments
                ? "bg-emerald-500 border-emerald-600 text-white shadow-sm animate-pulse"
                : "bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            }`}
            title={isPreviewingSegments ? "Stop preview" : "Preview all segments in order"}
          >
            {isPreviewingSegments ? (
              <><StopCircle className="w-3 h-3" /><span>Seg {previewSegmentIndex + 1}/{segments.length}</span></>
            ) : (
              <><PlayCircle className="w-3 h-3" /><span>Preview</span></>
            )}
          </button>
        </div>

        <button
          onClick={handleMerge}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all active:scale-95"
        >
          <GitMerge className="w-3.5 h-3.5" />
          <span>Merge to Clip</span>
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
        {[...segments].sort((a, b) => a.start - b.start).map((seg, index) => {
          const isCurrentSeg = isPreviewingSegments && previewSegmentIndex === index;
          return (
            <div
              key={seg.id}
              className={`flex items-center justify-between border shadow-sm rounded-md px-3 py-2 transition-all ${
                isCurrentSeg
                  ? "bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300"
                  : "bg-white border-gray-200 hover:border-emerald-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isCurrentSeg ? "bg-emerald-500 animate-pulse" : "bg-emerald-400"}`} />
                <span className="text-xs font-medium text-gray-700">Segment {index + 1}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-[11px] text-gray-500 font-mono">
                  {formatTime(seg.start)} – {formatTime(seg.end)}
                </span>
                <button
                  onClick={() => removeSegment(seg.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove Segment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
