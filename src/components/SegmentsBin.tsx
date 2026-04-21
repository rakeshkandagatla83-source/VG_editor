"use client";

import { Trash2, PlayCircle, StopCircle } from "lucide-react";
import { useVideoEditor } from "@/contexts/VideoEditorContext";

export function SegmentsBin() {
  const {
    segments, removeSegment,
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

  if (segments.length === 0) return null;

  return (
    <div className="w-full mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
      {/* Header row — title + preview button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Segments Bin ({segments.length})
          </h3>

          {/* ▶ Preview button — right after the title */}
          <button
            onClick={isPreviewingSegments ? stopSegmentPreview : startSegmentPreview}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border ${
              isPreviewingSegments
                ? "bg-emerald-500 border-emerald-600 text-white shadow-sm animate-pulse"
                : "bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
            }`}
            title={isPreviewingSegments ? "Stop preview" : "Preview all segments in order"}
          >
            {isPreviewingSegments ? (
              <><StopCircle className="w-3.5 h-3.5" /><span>Seg {previewSegmentIndex + 1}/{segments.length}</span></>
            ) : (
              <><PlayCircle className="w-3.5 h-3.5" /><span>Preview</span></>
            )}
          </button>
        </div>

        <span className="text-xs font-normal text-gray-500">
          Segments will be merged into a single clip upon creation.
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {[...segments].sort((a, b) => a.start - b.start).map((seg, index) => {
          const isCurrentSeg = isPreviewingSegments && previewSegmentIndex === index;
          return (
            <div
              key={seg.id}
              className={`flex items-center space-x-2 border shadow-sm rounded-md px-3 py-1.5 transition-all ${
                isCurrentSeg
                  ? "bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300"
                  : "bg-white border-emerald-200"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isCurrentSeg ? "bg-emerald-500 animate-pulse" : "bg-emerald-400"}`} />
              <span className="text-xs font-medium text-gray-700">Segment {index + 1}</span>
              <span className="text-xs text-gray-500 font-mono">
                {formatTime(seg.start)} – {formatTime(seg.end)}
              </span>
              <button
                onClick={() => removeSegment(seg.id)}
                className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove Segment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
